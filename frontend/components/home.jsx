import React, { useState } from 'react';
import ApplyModal from './ApplyModal';

export default function Home() {
  const [show, setShow] = useState(false);

  return (
    <div className="container mt-4">
      <div className="p-4 bg-light rounded shadow-sm">
        <h1>AW_Tech </h1>
        <p className="lead">We provide hands-on industrial attachment opportunities for secondary school students — training, mentorship, and placement in tech and industry.</p>

        <h5>Attachment stages</h5>
        <ul>
          <li>Orientation</li>
          <li>Practical Labs</li>
          <li>Project Work</li>
          <li>Evaluation</li>
        </ul>

        <button className="btn btn-primary me-2" onClick={()=>setShow(true)}>Apply Now</button>
        <a className="btn btn-outline-secondary" href="/status">Check Application Status</a>
      </div>

      <section className="mt-4">
        <h3>Why AW_Tech?</h3>
        <p>Our program combines mentorship from industry professionals, hands-on workshops, and project placement to help you transition from school to practical work experience.</p>
      </section>

      <ApplyModal show={show} onClose={()=>setShow(false)} />
    </div>
  );
}
