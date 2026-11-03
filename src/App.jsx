
import { useState } from "react";
import { supabase } from "./lib/supabase";
import Admin from "./Admin";

const SERVICE_TAGS = [
  "የምግብና መጠጥ አገልግሎት",
  "የክፍሎች አገልግሎት",
  "የሬስቶራንት አገልግሎት",
  "የመብሰቢያ አዳራሽ",
  "የሰራተኞች አስተናጋጅነት",
];

function today() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function CustomerFeedback() {
  const [date, setDate] = useState(today());
  const [room, setRoom] = useState("");
  const [hall, setHall] = useState("");
  const [score, setScore] = useState(null);
  const [comments, setComments] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function addTag(tag) {
    if (!tags.includes(tag)) {
      setTags((previous) => [...previous, tag]);
      setComments((previous) =>
        previous.trim() ? `${previous.trim()}, ${tag}: ` : `${tag}: `
      );
    }
  }

  async function submitFeedback(event) {
    event.preventDefault();
    setError("");

    if (score === null) {
      setError("እባክዎን ከ 0 እስከ 10 ያለውን ነጥብ ይምረጡ።");
      return;
    }

    setLoading(true);

    const { error: submitError } = await supabase
      .from("customer_feedback")
      .insert([
        {
          feedback_date: date,
          room_number: room.trim() || null,
          meeting_hall: hall.trim() || null,
          rating: score,
          comments: comments.trim(),
          service_tags: tags,
          source_location: "Customer web form",
          is_anonymous: false,
        },
      ]);

    setLoading(false);

    if (submitError) {
      console.error("Feedback submission error:", submitError);
      setError("አስተያየትዎን መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።");
      return;
    }

    setSuccess(true);
  }

  function resetForm() {
    setDate(today());
    setRoom("");
    setHall("");
    setScore(null);
    setComments("");
    setTags([]);
    setError("");
    setSuccess(false);
  }

  const ratingMessage =
    score === null
      ? ""
      : score <= 5
        ? "ስለተፈጠረው ክፍተት እናዝናለን። እባክዎን ጉድለታችንን ከታች ይግለጹልን።"
        : score <= 7
          ? "እናመሰግናለን! የበለጠ ለማሻሻል ምን እንድናደርግ ይመክሩናል?"
          : "በአገልግሎታችን ደስተኛ ስለሆኑ በጣም እናመሰግናለን!";

  return (
    <main className="feedback-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; }
        .feedback-page {
          min-height: 100vh;
          padding: 32px 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg,#0f172a,#1e293b);
          font-family: 'Noto Sans Ethiopic','Poppins',sans-serif;
          color: #1e293b;
        }
        .feedback-card {
          width: 100%;
          max-width: 850px;
          overflow: hidden;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 25px 60px rgba(0,0,0,.3);
        }
        .feedback-header {
          background: #0f172a;
          color: white;
          text-align: center;
          padding: 30px 20px;
          border-bottom: 5px solid #c59d33;
        }
        .rv-logo {
          width: 64px; height: 64px; margin: auto auto 12px;
          border: 1px solid #c59d33; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #c59d33; font-size: 23px; font-weight: 800;
          background: rgba(197,157,51,.15);
        }
        .feedback-header h1 { color: #d4ad50; margin: 0 0 5px; font-size: 27px; }
        .feedback-header h2 { font-size: 19px; margin: 12px 0 0; }
        .feedback-header p { color: #94a3b8; font-size: 12px; margin: 0; letter-spacing: 2px; }
        .feedback-content { padding: 28px; }
        .intro {
          background: #fbf8ed; border-left: 4px solid #c59d33;
          border-radius: 5px; padding: 16px; line-height: 1.9;
          font-size: 14px; margin-bottom: 25px;
        }
        .metadata {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 12px; padding: 16px; margin-bottom: 28px;
        }
        .field label { display: block; font-size: 12px; font-weight: 700; margin-bottom: 7px; color: #475569; }
        .field input, .feedback-textarea {
          width: 100%; border: 1px solid #cbd5e1; border-radius: 8px;
          padding: 11px; font: inherit; font-size: 13px; background: white;
        }
        .field input:focus, .feedback-textarea:focus {
          outline: 2px solid #c59d33; border-color: #c59d33;
        }
        .question { margin: 25px 0; }
        .question-title { font-size: 17px; font-weight: 800; line-height: 1.8; }
        .muted { color: #64748b; font-size: 12px; }
        .legend {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 10px;
          background: #f1f5f9; padding: 13px; border-radius: 8px;
          font-size: 12px; margin: 14px 0;
        }
        .rating-grid { display: grid; grid-template-columns: repeat(11,1fr); gap: 7px; }
        .rating {
          border: 1px solid; border-radius: 8px; padding: 13px 2px;
          font-weight: 800; cursor: pointer; transition: .2s;
        }
        .rating:hover { transform: translateY(-2px); }
        .rating.low { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
        .rating.mid { background: #fffbeb; border-color: #fde68a; color: #b45309; }
        .rating.high { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
        .rating.selected { color: white; transform: scale(1.07); box-shadow: 0 5px 12px #0003; }
        .rating.selected.low { background: #dc2626; }
        .rating.selected.mid { background: #d97706; }
        .rating.selected.high { background: #059669; }
        .rating-message { padding: 13px; border-radius: 8px; text-align: center; font-size: 13px; margin-top: 15px; }
        .rating-message.low { background: #fee2e2; color: #991b1b; }
        .rating-message.mid { background: #fef3c7; color: #92400e; }
        .rating-message.high { background: #d1fae5; color: #065f46; }
        .tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
        .tag-button {
          border: 1px solid #cbd5e1; border-radius: 30px; padding: 7px 12px;
          background: #f1f5f9; font: inherit; font-size: 11px; cursor: pointer;
        }
        .tag-button:hover { background: #fbf1d2; }
        .feedback-textarea { resize: vertical; min-height: 110px; }
        .submit-button {
          width: 100%; border: 0; border-radius: 10px; padding: 15px;
          background: #b8860b; color: white; font: inherit;
          font-weight: 800; cursor: pointer; font-size: 15px;
        }
        .submit-button:hover { background: #966607; }
        .submit-button:disabled { opacity: .6; cursor: wait; }
        .feedback-footer {
          background: #f1f5f9; padding: 13px 22px; text-align: right;
          color: #64748b; font-size: 11px; border-top: 1px solid #e2e8f0;
        }
        .error-message { color: #b91c1c; background: #fee2e2; padding: 12px; border-radius: 8px; font-size: 13px; margin: 12px 0; }
        .modal-backdrop {
          position: fixed; inset: 0; background: #0f172add;
          display: flex; align-items: center; justify-content: center;
          padding: 16px; z-index: 10;
        }
        .success-modal {
          background: white; width: 100%; max-width: 430px;
          padding: 28px; border-radius: 16px; text-align: center;
          box-shadow: 0 20px 50px #0005;
        }
        .success-icon { font-size: 48px; color: #059669; }
        .summary { background: #f8fafc; padding: 14px; border-radius: 8px; text-align: left; font-size: 12px; line-height: 2; margin: 18px 0; }
        .modal-button { width: 100%; background: #0f172a; color: white; border: 0; padding: 12px; border-radius: 8px; font: inherit; cursor: pointer; }
        @media(max-width:650px) {
          .metadata { grid-template-columns: 1fr; }
          .legend { grid-template-columns: 1fr; }
          .feedback-content { padding: 18px; }
          .rating-grid { gap: 3px; }
          .rating { padding: 11px 0; font-size: 12px; }
          .feedback-header h1 { font-size: 23px; }
          .question-title { font-size: 15px; }
        }
      `}</style>

      <div className="feedback-card">
        <header className="feedback-header">
          <div className="rv-logo">RV</div>
          <h1>ሪፍት ቫሊ ሆቴል</h1>
          <p>RIFT VALLEY HOTEL • ADAMA</p>
          <div style={{ width: 64, height: 2, background: "#c59d33", margin: "15px auto" }} />
          <h2>የደንበኞች አስተያየት ዳሰሳ ጥናት</h2>
        </header>

        <div className="feedback-content">
          <div className="intro">
            እኛን ስለመረጡን እናመሰግናለን! አገልግሎታችንን ለማሻሻል ዘወትር እንጣጣራለን፤ እንዲሁም የእርስዎን ታማኝ አስተያየት ከፍ አድርገን እንመለከታለን። ይህ አጭር ዳሰሳ ጥናት ከአንድ ደቂቃ ያነሰ ጊዜ ይወስዳል።
          </div>

          <form onSubmit={submitFeedback}>
            <div className="metadata">
              <div className="field">
                <label>ቀን (Date)</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="field">
                <label>የክፍል ቁጥር (Room No)</label>
                <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="ምሳሌ: 204" />
              </div>
              <div className="field">
                <label>የመብሰቢያ አዳራሽ (Meeting Hall)</label>
                <input value={hall} onChange={(e) => setHall(e.target.value)} placeholder="ምሳሌ: አዳራሽ A" />
              </div>
            </div>

            <section className="question">
              <div className="question-title">
                1. ከ 0 እስከ 10 ባለው ልኬት መሠረት፤ ሪፍት ቫሊ ሆቴልን (Rift Valley Hotel) ለጓደኛዎ፣ ለቤተሰብዎ አባል ወይም ለሥራ ባልደረባዎ በአገልግሎታችን እንዲጠቀሙ ሆቴላችንን የመጠቀም ፍላጎትዎ ምን ያህል ነው?
              </div>
              <p className="muted">(በምርጫዎ ቁጥር ላይ ጠቅ ያድርጉ)</p>

              <div className="legend">
                <div>🔴 <strong>0–5:</strong> አገልግሎቱ ደካማ ነው</div>
                <div>🟠 <strong>6–7:</strong> መካከለኛ አገልግሎት</div>
                <div>🟢 <strong>8–10:</strong> ጥሩ አገልግሎት</div>
              </div>

              <div className="rating-grid">
                {Array.from({ length: 11 }, (_, i) => {
                  const type = i <= 5 ? "low" : i <= 7 ? "mid" : "high";
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`rating ${type} ${score === i ? "selected" : ""}`}
                      onClick={() => setScore(i)}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>

              {score !== null && (
                <div className={`rating-message ${score <= 5 ? "low" : score <= 7 ? "mid" : "high"}`}>
                  {ratingMessage}
                </div>
              )}
            </section>

            <section className="question">
              <div className="question-title">2. ዋናው ምክንያት</div>
              <p style={{ fontSize: 13, lineHeight: 1.9, color: "#475569" }}>
                ከላይ ለሰጡትን ምላሽ ዋናው ምክንያት ምንድን ነው? (የምግብና መጠጥ አገልግሎት፣ የክፍሎች አገልግሎት፣ የሬስቶራንት አገልግሎት ወይም ሌላ...?) በጥሩ ሁኔታ የሰራነውን ወይም ልናሻሽለው የሚገባውን ነገር በነፃነት ይግለጹልን።
              </p>

              <div className="tag-list">
                {SERVICE_TAGS.map((tag) => (
                  <button className="tag-button" type="button" key={tag} onClick={() => addTag(tag)}>
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                className="feedback-textarea"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="አስተያየትዎን እዚህ ይጻፉ..."
                required
              />
            </section>

            {error && <div className="error-message">{error}</div>}

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 20, marginTop: 25 }}>
              <p style={{ textAlign: "center", fontWeight: 700, fontStyle: "italic", fontSize: 13, marginBottom: 18 }}>
                ዋጋ ያለው ጊዜዎን ሰውተው ስለሰጡን አስተያየት በቅድሚያ እናመሰግናለን!
              </p>
              <button className="submit-button" type="submit" disabled={loading}>
                {loading ? "በመላክ ላይ..." : "✉ አስተያየትዎን ላክ (Submit Feedback)"}
              </button>
            </div>
          </form>
        </div>

        <footer className="feedback-footer">
          Approved by: <strong style={{ color: "#334155" }}>Rift Valley Hotel Management</strong>
        </footer>
      </div>

      {success && (
        <div className="modal-backdrop">
          <div className="success-modal">
            <div className="success-icon">✓</div>
            <h2>እናመሰግናለን!</h2>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.8 }}>
              አስተያየትዎ በተሳካ ሁኔታ ተልኳል። አገልግሎታችንን ለማሻሻል የምንጠቀመበት ይሆናል።
            </p>
            <div className="summary">
              <div><strong>የተሰጠ ነጥብ:</strong> {score} / 10</div>
              <div><strong>ቀን:</strong> {date}</div>
              <div><strong>ክፍል/አዳራሽ:</strong> {room || hall ? `${room ? `ክፍል ${room}` : ""}${room && hall ? " / " : ""}${hall}` : "ግልጽ ያልሆነ"}</div>
            </div>
            <button className="modal-button" onClick={resetForm}>እሺ (OK)</button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path === "/admin" || path.startsWith("/admin/")) {
    return <Admin />;
  }

  return <CustomerFeedback />;
}
