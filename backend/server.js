require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Application = require('./models/Application');
const Admin = require('./models/Admin');
const ActivityLog = require('./models/ActivityLog');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/awtech';
mongoose.connect(MONGO_URI).then(()=>console.log('MongoDB connected')).catch(err=>console.error(err));

// Multer setup
const payslipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, 'uploads', 'payslips');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + (file.originalname || 'payslip'));
  }
});
const upload = multer({ storage: payslipStorage });

// Nodemailer transporter (optional)
let transporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.log('Email not configured in .env; emails will be skipped (use Ethereal/Mailtrap in dev).');
}

// Helpers
function assignClassByLevel(level) {
  if (level === 'level3') return 'Beginner Class';
  if (level === 'level4') return 'Intermediate Class';
  if (level === 'level5') return 'Advanced Class';
  return 'General Class';
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
}

function ensureAdminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(parts[1], process.env.JWT_SECRET || 'secret');
    req.admin = payload; // should contain username
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function logActivity(adminUsername, action, targetApplicationId = null, details = '') {
  try {
    const entry = new ActivityLog({ admin: adminUsername, action, targetApplicationId, details });
    await entry.save();
  } catch (err) {
    console.error('ActivityLog error', err);
  }
}

// ---------- Student routes ----------

// Student applies (multipart/form-data with 'payslip')
app.post('/api/apply', upload.single('payslip'), async (req, res) => {
  try {
    const { fullName, email, phone, dob, secondaryLevel, school } = req.body;
    if (!fullName || !email || !secondaryLevel) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const payslipPath = req.file ? path.join('uploads', 'payslips', path.basename(req.file.path)) : null;
    const appDoc = new Application({
      fullName, email, phone, dob, secondaryLevel, school, payslipPath
    });
    await appDoc.save();

    // optional email confirmation
    if (transporter) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'AW_Tech Application Received',
        text: `Hello ${fullName}, we received your application. Status: pending.`
      }).catch(err => console.error('Email send error', err));
    }

    res.json({ success: true, message: 'Application received and pending admin review.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Student: check status by email (and optional phone)
app.get('/api/status', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Provide email' });
    const applications = await Application.find({ email }).sort({ createdAt: -1 }).lean();
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Admin auth & management ----------

// Admin register: only allowed when no admins exist
app.post('/api/admin/register', async (req, res) => {
  try {
    const existing = await Admin.countDocuments({});
    if (existing > 0) {
      return res.status(403).json({ success: false, error: 'Admin already exists. Registration disabled.' });
    }
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Provide username and password' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const admin = new Admin({ username, passwordHash: hash });
    await admin.save();
    res.json({ success: true, message: 'Admin created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Admin login (check Admin collection first). If no Admin and env ADMIN_USER/ADMIN_PASS match, create admin record automatically.
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Provide username and password' });

    let admin = await Admin.findOne({ username });

    if (admin) {
      const match = await bcrypt.compare(password, admin.passwordHash);
      if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    } else {
      // No admin with that username found. Allow fallback to environment credentials if they match.
      const ENV_USER = process.env.ADMIN_USER;
      const ENV_PASS = process.env.ADMIN_PASS;
      if (ENV_USER && ENV_PASS && username === ENV_USER && password === ENV_PASS) {
        // create admin record automatically if none exist
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        admin = new Admin({ username, passwordHash: hash });
        await admin.save();
        console.log('Created initial admin from ENV credentials.');
      } else {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    }

    const token = signToken({ username: admin.username });
    await logActivity(admin.username, 'login', null, 'Admin login');
    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Change password (authenticated)
app.post('/api/admin/change-password', ensureAdminAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Provide oldPassword and newPassword' });

    const admin = await Admin.findOne({ username: req.admin.username });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const ok = await bcrypt.compare(oldPassword, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Old password incorrect' });

    const salt = await bcrypt.genSalt(10);
    admin.passwordHash = await bcrypt.hash(newPassword, salt);
    await admin.save();

    await logActivity(admin.username, 'password_change', null, 'Admin changed password');
    res.json({ success: true, message: 'Password changed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Admin APIs (protected) ----------

// Stats: counts for KPIs
app.get('/api/admin/stats', ensureAdminAuth, async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'approved' }),
      Application.countDocuments({ status: 'rejected' }),
      Application.countDocuments({})
    ]);
    res.json({ pending, approved, rejected, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apps list with search, filter, pagination
app.get('/api/admin/apps', ensureAdminAuth, async (req, res) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && ['pending','approved','rejected'].includes(status)) filter.status = status;
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [{ fullName: regex }, { email: regex }, { phone: regex }];
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(200, parseInt(limit, 10) || 20);

    const [total, apps] = await Promise.all([
      Application.countDocuments(filter),
      Application.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * lim).limit(lim).lean()
    ]);

    res.json({ total, page: pageNum, limit: lim, data: apps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export CSV of filtered apps
app.get('/api/admin/export', ensureAdminAuth, async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = {};
    if (status && ['pending','approved','rejected'].includes(status)) filter.status = status;
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [{ fullName: regex }, { email: regex }, { phone: regex }];
    }

    const apps = await Application.find(filter).sort({ createdAt: -1 }).lean();

    function csvEscape(value) {
      if (value === null || value === undefined) return '';
      const s = String(value).replace(/\r?\n/g, ' ');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }

    const header = ['FullName','Email','Phone','SecondaryLevel','Status','ClassAssigned','AppliedAt','PayslipPath','AdmissionLetterPath'];
    const rows = apps.map(a => [
      csvEscape(a.fullName),
      csvEscape(a.email),
      csvEscape(a.phone),
      csvEscape(a.secondaryLevel),
      csvEscape(a.status),
      csvEscape(a.classAssigned),
      csvEscape(a.createdAt ? new Date(a.createdAt).toISOString() : ''),
      csvEscape(a.payslipPath || ''),
      csvEscape(a.admissionLetterPath || '')
    ].join(','));

    const csv = [header.join(','), ...rows].join('\r\n');

    const filename = `awtech-applications-${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activity logs (recent)
app.get('/api/admin/logs', ensureAdminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(200, parseInt(limit, 10) || 50);
    const total = await ActivityLog.countDocuments({});
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean();
    res.json({ total, page: p, limit: l, data: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve endpoint (logs activity)
app.post('/api/admin/approve/:id', ensureAdminAuth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Not found' });
    application.status = 'approved';
    application.classAssigned = assignClassByLevel(application.secondaryLevel);

    // generate PDF
    const lettersDir = path.join(__dirname, 'uploads', 'admission_letters');
    fs.mkdirSync(lettersDir, { recursive: true });
    const pdfPath = path.join(lettersDir, `${Date.now()}-${application._id}.pdf`);

    const doc = new PDFDocument();
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    doc.fontSize(18).text('AW_Tech Admission Letter', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${application.fullName}`);
    doc.text(`Email: ${application.email}`);
    doc.text(`Phone: ${application.phone || '-'}`);
    doc.text(`Assigned Class: ${application.classAssigned}`);
    doc.text(`Start Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text('Congratulations! You are eligible to start at AW_Tech.', { align: 'left' });
    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    application.admissionLetterPath = path.join('uploads', 'admission_letters', path.basename(pdfPath));
    await application.save();

    // log activity
    await logActivity(req.admin.username, 'approve', application._id, `Approved application for ${application.fullName}`);

    // send email with attachment (if configured)
    if (transporter) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: application.email,
        subject: 'AW_Tech Admission Letter',
        text: `Hello ${application.fullName}, congratulations — you have been approved. See attached admission letter.`,
        attachments: [{ filename: 'admission_letter.pdf', path: pdfPath }]
      }).catch(err => console.error('Email send error', err));
    }

    res.json({ success: true, message: 'Approved and admission letter generated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Reject endpoint (logs activity)
app.post('/api/admin/reject/:id', ensureAdminAuth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Not found' });
    application.status = 'rejected';
    await application.save();

    await logActivity(req.admin.username, 'reject', application._id, `Rejected application for ${application.fullName}`);

    if (transporter) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: application.email,
        subject: 'AW_Tech Application Update',
        text: `Hello ${application.fullName}, your application status: rejected. Contact admin for details.`
      }).catch(err => console.error('Email send error', err));
    }

    res.json({ success: true, message: 'Applicant rejected.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log('Server running on port', PORT));
