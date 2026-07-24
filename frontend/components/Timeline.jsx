
import React from 'react';

export default function Timeline() {
  const stages = [
    { title: 'Orientation', desc: 'Introduction, expectations, and safety briefings.' },
    { title: 'Practical Labs', desc: 'Hands-on skill-building sessions in workshops.' },
    { title: 'Project Work', desc: 'Work in teams on a guided project to apply skills.' },
    { title: 'Evaluation', desc: 'Assessment and certification for successful students.' }
  ];

  return (
    <div className="timeline mt-3">
      <div className="row">
        {stages.map((s, i) => (
          <div key={i} className="col-md-3 text-center mb-3">
            <div className="stage-circle mx-auto mb-2">{i + 1}</div>
            <h6>{s.title}</h6>
            <p className="text-muted small">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
