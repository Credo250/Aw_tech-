import React, { useState } from 'react';
import ApplyModal from './ApplyModal';
import MainCarousel from './MainCarousel';
import Testimonials from './Testimonials';
import Timeline from './Timeline';

export default function Home() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <MainCarousel />

      <div className="container mt-4">
        <div className="p-4 bg-light rounded shadow-sm">
          <h1>AW_Tech — Industrial Attachment in Muhang</h1>
          <p className="lead">We provide hands-on industrial attachment opportunities for secondary school students — training, mentorship, and placement in tech and industry.</p>

          <h5>Attachment stages</h5>
          <Timeline />

          <div className="mt-3">
            <button className="btn btn-primary me-2" onClick={() => setShow(true)}>Apply Now</button>
            <a className="btn btn-outline-secondary" href="/status">Check Application Status</a>
          </div>
        </div>

        <section className="mt-5">
          <h3>Why AW_Tech?</h3>
          <p>Our program combines mentorship from industry professionals, hands-on workshops, and project placement to help you transition from school to practical work experience.</p>
        </section>

        <section className="mt-4">
          <h3>Student Testimonials</h3>
          <Testimonials />
        </section>
      </div>

      <ApplyModal show={show} onClose={() => setShow(false)} />
    </div>
  );
}
