// src/pages/public/LandingPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const T = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const G = {
  'O-': T,
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

export default function LandingPage() {
  const [selectedType, setSelectedType] = useState('O+');

  const giveList = G[selectedType] || [];
  const getList = T.filter((x) => G[x] && G[x].includes(selectedType));

  return (
    <div className="landing-page-root">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <symbol id="mail" viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </symbol>
          <symbol id="target" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4" />
          </symbol>
          <symbol id="link" viewBox="0 0 24 24">
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
            <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
          </symbol>
          <symbol id="file" viewBox="0 0 24 24">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h4" />
          </symbol>
          <symbol id="user" viewBox="0 0 24 24">
            <circle cx="9" cy="8" r="4" />
            <path d="M2 21a7 7 0 0 1 14 0" />
            <path d="m16 11 2 2 4-4" />
          </symbol>
          <symbol id="lock" viewBox="0 0 24 24">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </symbol>
          <symbol id="ok" viewBox="0 0 24 24">
            <path d="m5 12 5 5 9-10" />
          </symbol>
        </defs>
      </svg>

      <header className="nav">
        <div className="w">
          <a className="brand" href="#top">
            <img src="/hemolink-landing-logo.png" alt="HemoLink" />
            HemoLink
          </a>
          <nav className="links" aria-label="Sections">
            <a href="#groups">Blood groups</a>
            <a href="#roles">Roles</a>
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="acts">
            <Link className="btn l" to="/login">Log in</Link>
            <Link className="btn p" to="/signup">Sign up</Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="w">
            <div>
              <h1>Every drop connects a heart.</h1>
              <p className="l">
                HemoLink is a blood donation platform that helps patients and hospitals reach compatible donors quickly, and helps donors respond to the requests that match them.
              </p>
              <div className="row">
                <Link className="btn p" to="/signup">Sign up</Link>
                <Link className="btn g" to="/login">Log in</Link>
              </div>
            </div>
            <div className="hl">
              <figure className="lg">
                <img src="/hemolink-landing-logo.png" alt="HemoLink" />
                <figcaption className="lgtag">
                  <span>CONNECT</span>
                  <span>&bull;</span>
                  <span>DONATE</span>
                  <span>&bull;</span>
                  <span>SAVE LIVES</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="s cmp" id="groups">
          <div className="w">
            <div className="hd">
              <h2>Check blood group compatibility</h2>
              <p>Select a blood group to see who it can donate to and receive from. HemoLink uses the same rules when matching donors.</p>
            </div>
            <div className="types" role="group" aria-label="Choose a blood group">
              {T.map((t) => (
                <button
                  key={t}
                  type="button"
                  data-t={t}
                  aria-pressed={selectedType === t}
                  onClick={() => setSelectedType(t)}
                >
                  {t.replace('-', '−')}
                </button>
              ))}
            </div>
            <div className="out" aria-live="polite">
              <div>
                <h3>Can donate to</h3>
                <div className="chips">
                  {giveList.map((x) => (
                    <span key={x}>{x.replace('-', '−')}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3>Can receive from</h3>
                <div className="chips">
                  {getList.map((x) => (
                    <span key={x}>{x.replace('-', '−')}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="s alt" id="roles">
          <div className="w">
            <div className="hd">
              <h2>Two roles, one platform</h2>
              <p>You choose an account type when you sign up, and each type has its own dashboard.</p>
            </div>
            <div className="roles">
              <div className="role">
                <h3>Donors</h3>
                <p>Share your blood group and city, and decide when you are available.</p>
                <ul>
                  <li><svg className="i"><use href="#ok" /></svg>Create a profile with your blood group and city</li>
                  <li><svg className="i"><use href="#ok" /></svg>Switch availability on or off at any time</li>
                  <li><svg className="i"><use href="#ok" /></svg>See open emergency requests that match you</li>
                  <li><svg className="i"><use href="#ok" /></svg>Respond with a message and contact details</li>
                  <li><svg className="i"><use href="#ok" /></svg>Track your donation history</li>
                </ul>
              </div>
              <div className="role r">
                <h3>Receivers</h3>
                <p>Patients and hospitals who need to reach donors fast.</p>
                <ul>
                  <li><svg className="i"><use href="#ok" /></svg>Create a profile for a patient or hospital</li>
                  <li><svg className="i"><use href="#ok" /></svg>Search available donors by blood group and city</li>
                  <li><svg className="i"><use href="#ok" /></svg>Send a request with hospital, urgency, and notes</li>
                  <li><svg className="i"><use href="#ok" /></svg>Broadcast alerts to matching blood groups</li>
                  <li><svg className="i"><use href="#ok" /></svg>Receive donor responses and notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="s" id="how">
          <div className="w">
            <div className="hd">
              <h2>How a request works</h2>
              <p>From the moment a request is posted to the moment a donor is on the way.</p>
            </div>
            <div className="steps">
              <div className="st">
                <div className="n">Step 1</div>
                <h3>Post the request</h3>
                <p>Add the blood group, hospital, urgency, and notes. Attach a prescription if you have one.</p>
              </div>
              <div className="st">
                <div className="n">Step 2</div>
                <h3>Donors are alerted</h3>
                <p>Donors with a compatible blood group receive an email and an in-app notification.</p>
              </div>
              <div className="st">
                <div className="n">Step 3</div>
                <h3>Donors respond</h3>
                <p>They reply with a message and contact details, and you follow replies from your dashboard.</p>
              </div>
              <div className="st">
                <div className="n">Step 4</div>
                <h3>Donation is recorded</h3>
                <p>Donors keep a history of the donations they make through HemoLink.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="s alt" id="features">
          <div className="w">
            <div className="hd">
              <h2>Built for urgent situations</h2>
              <p>Each feature shortens the time between a request and a response.</p>
            </div>
            <div className="fg">
              <div className="f">
                <div className="ic"><svg className="i"><use href="#target" /></svg></div>
                <h3>Blood group matching</h3>
                <p>Requests reach donors whose blood group is compatible, so alerts go to people who can act on them.</p>
              </div>
              <div className="f">
                <div className="ic"><svg className="i"><use href="#mail" /></svg></div>
                <h3>Email alerts</h3>
                <p>Donors are emailed about matching emergencies, and receivers are emailed when a donor responds.</p>
              </div>
              <div className="f">
                <div className="ic"><svg className="i"><use href="#link" /></svg></div>
                <h3>Public request page</h3>
                <p>Every request has a link anyone can open without an account, ready to share with family and friends.</p>
              </div>
              <div className="f">
                <div className="ic"><svg className="i"><use href="#file" /></svg></div>
                <h3>Document upload</h3>
                <p>Attach a doctor's prescription or medical document so donors can see the need is genuine.</p>
              </div>
              <div className="f">
                <div className="ic"><svg className="i"><use href="#user" /></svg></div>
                <h3>Donor availability</h3>
                <p>Donors mark themselves active or inactive, so receivers search only people who can come.</p>
              </div>
              <div className="f">
                <div className="ic"><svg className="i"><use href="#lock" /></svg></div>
                <h3>Secure accounts</h3>
                <p>Sign in with a protected account, and reset your password with a code sent to your email.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="s" id="faq">
          <div className="w">
            <div className="faqw">
              <div className="hd">
                <h2>Frequently asked questions</h2>
                <p>Can't find your answer? Create an account and explore the dashboards.</p>
              </div>
              <div>
                <details>
                  <summary>Do I need an account to see a shared request?</summary>
                  <p>No. Public request links open without logging in. You need an account to respond as a donor or to post a request.</p>
                </details>
                <details>
                  <summary>Who gets notified when I post a request?</summary>
                  <p>Donors whose blood group is compatible with the one you need, based on standard compatibility rules.</p>
                </details>
                <details>
                  <summary>Can I pause requests as a donor?</summary>
                  <p>Yes. Set your availability to inactive in your profile whenever you cannot donate.</p>
                </details>
                <details>
                  <summary>Can I attach a prescription to my request?</summary>
                  <p>Yes. Receivers can upload a doctor's prescription or another medical document with the request.</p>
                </details>
                <details>
                  <summary>What if I forget my password?</summary>
                  <p>Use the forgot password link on the login page. We email you a verification code to set a new password.</p>
                </details>
                <details>
                  <summary>Can one account be both donor and receiver?</summary>
                  <p>You choose one account type at signup, and each type has its own dashboard.</p>
                </details>
              </div>
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="w">
            <h2>Join the HemoLink network</h2>
            <p>Create an account in a minute, or log in to continue where you left off.</p>
            <div className="row">
              <Link className="btn p" to="/signup">Sign up</Link>
              <Link className="btn g" to="/login">Log in</Link>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="w">
          <div className="fg2">
            <div>
              <a className="brand" href="#top">
                <img src="/hemolink-footer-logo.png" alt="HemoLink" />
                HemoLink
              </a>
              <p style={{ maxWidth: '38ch' }}>A blood donation and emergency request platform connecting donors and receivers.</p>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                <li><Link to="/login">Log in</Link></li>
                <li><Link to="/signup">Sign up</Link></li>
              </ul>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li><a href="#how">How it works</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="fine">
            <span>© HemoLink. Concept preview.</span>
            <span>HemoLink does not replace emergency medical services.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
