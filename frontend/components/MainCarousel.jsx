import React from 'react';

export default function MainCarousel() {
  return (
    <div id="awtechCarousel" className="carousel slide" data-bs-ride="carousel">
      <div className="carousel-indicators">
        <button type="button" data-bs-target="#awtechCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
        <button type="button" data-bs-target="#awtechCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
        <button type="button" data-bs-target="#awtechCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
      </div>

      <div className="carousel-inner">
        <div className="carousel-item active" style={{height: '320px', background: '#0d6efd', color: '#fff'}}>
          <div className="d-flex h-100 align-items-center justify-content-center">
            <div className="text-center px-3">
              <h2>Hands-on Training</h2>
              <p>Work on real projects guided by industry mentors.</p>
            </div>
          </div>
        </div>

        <div className="carousel-item" style={{height: '320px', background: '#6c757d', color: '#fff'}}>
          <div className="d-flex h-100 align-items-center justify-content-center">
            <div className="text-center px-3">
              <h2>Mentorship & Support</h2>
              <p>Get personalised coaching to sharpen your skills.</p>
            </div>
          </div>
        </div>

        <div className="carousel-item" style={{height: '320px', background: '#198754', color: '#fff'}}>
          <div className="d-flex h-100 align-items-center justify-content-center">
            <div className="text-center px-3">
              <h2>Certification & Placement</h2>
              <p>Receive an admission letter and join the class suited for your level.</p>
            </div>
          </div>
        </div>
      </div>

      <button className="carousel-control-prev" type="button" data-bs-target="#awtechCarousel" data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button className="carousel-control-next" type="button" data-bs-target="#awtechCarousel" data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
}
