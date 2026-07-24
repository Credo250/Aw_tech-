import React from 'react';

const items = [
  { name: 'Alice N.', quote: 'AW_Tech helped me build confidence — I completed a real project and got valuable feedback.' },
  { name: 'Brian K.', quote: 'Mentors were very supportive; the hands-on sessions made everything clear.' },
  { name: 'Celine M.', quote: 'I was assigned to the Intermediate Class and learned practical skills that helped me find an internship.' }
];

export default function Testimonials() {
  return (
    <div className="row">
      {items.map((t, i) => (
        <div key={i} className="col-md-4 mb-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <p className="card-text">“{t.quote}”</p>
              <p className="card-text"><strong>{t.name}</strong></p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
