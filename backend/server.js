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

const Application = require('./models/Application');

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

function ensureAdminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(parts[1], process.env.JWT_SECRET || 'secret');
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Routes

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

// Admin login (returns JWT)
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Protected: get pending apps
app.get('/api/admin/pending', ensureAdminAuth, async (req, res) => {
  try {
    const pending = await Application.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected: approve
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

// Protected: reject
app.post('/api/admin/reject/:id', ensureAdminAuth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Not found' });
    application.status = 'rejected';
    await application.save();

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
