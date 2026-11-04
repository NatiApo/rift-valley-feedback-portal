import { useState } from "react";
import { supabase } from "./lib/supabase";
import Admin from "./Admin";

const SERVICE_TAGS = {
  en: ["Food & Beverage Service", "Room Service", "Restaurant Service", "Meeting Hall", "Staff Hospitality"],
  am: ["የምግብና መጠጥ አገልግሎት", "የክፍሎች አገልግሎት", "የሬስቶራንት አገልግሎት", "የመብሰቢያ አዳራሽ", "የሰራተኞች አስተናጋጅነት"],
  om: ["Tajaajila Nyaataa fi Dhugaatii", "Tajaajila Kutaa", "Tajaajila Mana Nyaataa", "Galma Walgahii", "Simannaa Hojjettootaa"],
};

const TEXT = {
  en: {
    title: "Guest Feedback", welcome: "Thank you for choosing Rift Valley Hotel. Your feedback helps us improve our service. This short survey takes less than a minute.",
    date: "Date", room: "Room number", hall: "Meeting hall", optional: "Optional",
    q1: "1. How likely are you to recommend Rift Valley Hotel to a friend, family member, or colleague?",
    choose: "Select a score from 0 to 10", poor: "Not likely", neutral: "Neutral", likely: "Very likely",
    lowMsg: "We're sorry your experience did not meet expectations. Please tell us how we can improve.",
    midMsg: "Thank you. What could we do to make your experience better?",
    highMsg: "We're delighted you enjoyed your experience. Thank you!",
    q2: "2. What is the main reason for your score?",
    q2help: "Tell us what went well or what we could improve. Please share your honest feedback.",
    comment: "Write your comments here…", thanks: "Thank you for your time and valuable feedback!",
    send: "Submit feedback", sending: "Submitting…", errorScore: "Please select a rating from 0 to 10.",
    errorSend: "We couldn't submit your feedback. Please try again.",
    successTitle: "Thank you!", successText: "Your feedback has been submitted successfully. We appreciate your help in improving our service.",
    score: "Your rating", sentDate: "Date", roomHall: "Room / Hall", notProvided: "Not provided", ok: "Done",
    approved: "A service of", management: "Rift Valley Hotel Management", selectLang: "Language",
  },
  am: {
    title: "የደንበኞች አስተያየት", welcome: "ሪፍት ቫሊ ሆቴልን ስለመረጡን እናመሰግናለን። አስተያየትዎ አገልግሎታችንን እንድናሻሽል ይረዳናል። ይህ አጭር ዳሰሳ ከአንድ ደቂቃ ያነሰ ጊዜ ይወስዳል።",
    date: "ቀን", room: "የክፍል ቁጥር", hall: "የመብሰቢያ አዳራሽ", optional: "አስፈላጊ አይደለም",
    q1: "1. ሪፍት ቫሊ ሆቴልን ለጓደኛዎ፣ ለቤተሰብዎ ወይም ለሥራ ባልደረባዎ የመጠቆም ዕድልዎ ምን ያህል ነው?",
    choose: "ከ0 እስከ 10 ያለውን ነጥብ ይምረጡ", poor: "በጣም ዝቅተኛ", neutral: "መካከለኛ", likely: "በጣም ከፍተኛ",
    lowMsg: "ተሞክሮዎ እንዳላረካዎት እናዝናለን። እንዴት ማሻሻል እንደምንችል ይንገሩን።",
    midMsg: "እናመሰግናለን። ተሞክሮዎን የተሻለ ለማድረግ ምን እናድርግ?",
    highMsg: "በአገልግሎታችን ደስተኛ ስለሆኑ በጣም እናመሰግናለን!",
    q2: "2. የነጥብዎ ዋና ምክንያት ምንድን ነው?",
    q2help: "ጥሩ የሰራነውን ወይም ማሻሻል ያለብንን ነገር በነፃነት ይግለጹልን።",
    comment: "አስተያየትዎን እዚህ ይጻፉ…", thanks: "ጊዜዎን ሰውተው አስተያየት ስለሰጡን እናመሰግናለን!",
    send: "አስተያየትዎን ላክ", sending: "በመላክ ላይ…", errorScore: "እባክዎ ከ0 እስከ 10 ያለውን ነጥብ ይምረጡ።",
    errorSend: "አስተያየትዎን መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
    successTitle: "እናመሰግናለን!", successText: "አስተያየትዎ በተሳካ ሁኔታ ተልኳል። አገልግሎታችንን ለማሻሻል ይረዳናል።",
    score: "የተሰጠ ነጥብ", sentDate: "ቀን", roomHall: "ክፍል / አዳራሽ", notProvided: "አልተገለጸም", ok: "እሺ",
    approved: "በ", management: "ሪፍት ቫሊ ሆቴል ማኔጅመንት", selectLang: "ቋንቋ",
  },
  om: {
    title: "Yaada Maamiltootaa", welcome: "Rift Valley Hotel filachuu keessaniif galatoomaa. Yaadni keessan tajaajila keenya fooyyessuuf nu gargaara. Gaaffiin gabaabaan kun daqiiqaa tokkoo gadi fudhata.",
    date: "Guyyaa", room: "Lakkoofsa kutaa", hall: "Galma walgahii", optional: "Dirqama miti",
    q1: "1. Rift Valley Hotel hiriyyaa, maatii ykn nama hojii waliin hojjettaniif hammam gorsitu?",
    choose: "Qabxii 0 hanga 10 filadhaa", poor: "Baay'ee xiqqaa", neutral: "Giddu galeessa", likely: "Baay'ee olaanaa",
    lowMsg: "Muuxannoon keessan akka isin hin gammachiifneef ni gaddina. Akkamitti fooyyessuu akka dandeenyu nutti himaa.",
    midMsg: "Galatoomaa. Muuxannoo keessan fooyyessuuf maal gochuu qabna?",
    highMsg: "Tajaajila keenya jaallachuu keessaniif baay'ee gammaddine. Galatoomaa!",
    q2: "2. Sababni qabxii keessanii inni guddaan maali?",
    q2help: "Waan gaarii hojjanne ykn waan fooyyessuu qabnu nuuf ibsaa. Yaada keessan dhugaa nuuf qoodaa.",
    comment: "Yaada keessan asitti barreessaa…", thanks: "Yeroo keessanii fi yaada gatii qabuuf galatoomaa!",
    send: "Yaada ergaa", sending: "Ergamaa jira…", errorScore: "Maaloo qabxii 0 hanga 10 filadhaa.",
    errorSend: "Yaada keessan erguun hin danda'amne. Maaloo irra deebi'aa yaalaa.",
    successTitle: "Galatoomaa!", successText: "Yaadni keessan milkaa'inaan ergameera. Tajaajila keenya fooyyessuuf nu gargaara.",
    score: "Qabxii keessan", sentDate: "Guyyaa", roomHall: "Kutaa / Galma", notProvided: "Hin kennamne", ok: "Tole",
    approved: "Kan bulchiinsa", management: "Rift Valley Hotel", selectLang: "Afaan",
  },
};

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function CustomerFeedback() {
  const [language, setLanguage] = useState("en");
  const t = TEXT[language];
  const tagsForLanguage = SERVICE_TAGS[language];
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
      setComments((previous) => previous.trim() ? `${previous.trim()}, ${tag}: ` : `${tag}: `);
    }
  }

  async function submitFeedback(event) {
    event.preventDefault();
    setError("");
    if (score === null) { setError(t.errorScore); return; }
    setLoading(true);
    const { error: submitError } = await supabase.from("customer_feedback").insert([{
      feedback_date: date,
      room_number: room.trim() || null,
      meeting_hall: hall.trim() || null,
      rating: score,
      comments: comments.trim(),
      service_tags: tags,
      source_location: "Customer web form",
      is_anonymous: false,
    }]);
    setLoading(false);
    if (submitError) {
      console.error("Feedback submission error:", submitError);
      setError(t.errorSend);
      return;
    }
    setSuccess(true);
  }

  function resetForm() {
    setDate(today()); setRoom(""); setHall(""); setScore(null);
    setComments(""); setTags([]); setError(""); setSuccess(false);
  }

  const ratingMessage = score === null ? "" : score <= 5 ? t.lowMsg : score <= 7 ? t.midMsg : t.highMsg;

  return (
    <main className="feedback-page" lang={language === "am" ? "am" : language === "om" ? "om" : "en"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .feedback-page { min-height:100vh; padding:34px 16px; display:flex; justify-content:center; align-items:center; background:linear-gradient(135deg,#eff8ff 0%,#f8fbff 52%,#eefbf8 100%); font-family:'Noto Sans Ethiopic','Inter',sans-serif; color:#243247; }
        .feedback-card { width:100%; max-width:850px; overflow:hidden; background:#fff; border:1px solid #e3edf6; border-radius:22px; box-shadow:0 18px 55px rgba(46,91,130,.12); }
        .feedback-header { position:relative; background:linear-gradient(115deg,#eaf6ff,#f5fbff 58%,#eafaf5); color:#243b53; text-align:center; padding:27px 20px 25px; border-bottom:1px solid #dcecf6; }
        .rv-logo { width:62px;height:62px;margin:0 auto 11px;border:2px solid #5aa5d6;border-radius:18px;display:flex;align-items:center;justify-content:center;color:#2476ad;font-size:22px;font-weight:800;background:#fff;box-shadow:0 5px 15px #5aa5d622; }
        .feedback-header h1 { color:#176da5;margin:0 0 5px;font-size:27px;font-weight:800; }
        .feedback-header h2 { color:#29445d;font-size:18px;margin:12px 0 0; }
        .feedback-header p { color:#6f879b;font-size:11px;margin:0;letter-spacing:2px;font-family:Inter,sans-serif; }
        .language-control { position:absolute;right:18px;top:18px;display:flex;align-items:center;gap:7px;color:#557086;font-size:11px;font-weight:700; }
        .language-control select { border:1px solid #c9dfed;border-radius:9px;padding:8px 10px;background:#fff;color:#23445d;font:inherit;cursor:pointer; }
        .feedback-content { padding:28px; }
        .intro { background:#f0f8ff;border:1px solid #dceefa;border-left:4px solid #58a6d8;border-radius:10px;padding:16px;line-height:1.9;font-size:14px;margin-bottom:24px;color:#3b566d; }
        .metadata { display:grid;grid-template-columns:repeat(3,1fr);gap:14px;background:#f8fbfd;border:1px solid #e4edf3;border-radius:13px;padding:16px;margin-bottom:27px; }
        .field label { display:block;font-size:12px;font-weight:700;margin-bottom:7px;color:#52677a; }
        .field input,.feedback-textarea { width:100%;border:1px solid #d4e1ea;border-radius:9px;padding:11px;font:inherit;font-size:13px;background:#fff;color:#25394b; }
        .field input:focus,.feedback-textarea:focus { outline:2px solid #b9e0f7;border-color:#68b2df; }
        .question { margin:25px 0; }
        .question-title { font-size:16px;font-weight:800;line-height:1.8;color:#263e54; }
        .muted { color:#7a8d9d;font-size:12px; }
        .legend { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:#f7fafc;padding:13px;border:1px solid #e8eff4;border-radius:9px;font-size:12px;margin:14px 0; }
        .rating-grid { display:grid;grid-template-columns:repeat(11,1fr);gap:7px; }
        .rating { border:1px solid;border-radius:9px;padding:13px 2px;font-weight:800;cursor:pointer;transition:.18s;background:#fff; }
        .rating:hover { transform:translateY(-2px);box-shadow:0 5px 12px #29445d16; }
        .rating.low { background:#fff4f2;border-color:#f4c9c2;color:#bd5146; }
        .rating.mid { background:#fff9e9;border-color:#f2dfaa;color:#a97716; }
        .rating.high { background:#effaf4;border-color:#b9e6ce;color:#278255; }
        .rating.selected { color:white;transform:translateY(-2px);box-shadow:0 5px 13px #29445d22; }
        .rating.selected.low { background:#df7569;border-color:#df7569; }
        .rating.selected.mid { background:#d6a943;border-color:#d6a943; }
        .rating.selected.high { background:#45a879;border-color:#45a879; }
        .rating-message { padding:13px;border-radius:9px;text-align:center;font-size:13px;margin-top:15px;line-height:1.7; }
        .rating-message.low { background:#fff1ef;color:#a94a40; }
        .rating-message.mid { background:#fff8e6;color:#8c681e; }
        .rating-message.high { background:#edfaf3;color:#26754e; }
        .tag-list { display:flex;flex-wrap:wrap;gap:8px;margin:12px 0; }
        .tag-button { border:1px solid #d4e5f0;border-radius:30px;padding:8px 12px;background:#f4faff;color:#32698e;font:inherit;font-size:11px;cursor:pointer; }
        .tag-button:hover { background:#e5f4ff;border-color:#9acbe9; }
        .feedback-textarea { resize:vertical;min-height:115px;line-height:1.7; }
        .submit-button { width:100%;border:0;border-radius:10px;padding:15px;background:linear-gradient(90deg,#2588c4,#36a6bd);color:#fff;font:inherit;font-weight:800;cursor:pointer;font-size:14px;box-shadow:0 7px 16px #2588c426; }
        .submit-button:hover { background:linear-gradient(90deg,#1c77b0,#2995ad); }
        .submit-button:disabled { opacity:.6;cursor:wait; }
        .feedback-footer { background:#f8fbfd;padding:14px 22px;text-align:right;color:#8495a4;font-size:11px;border-top:1px solid #e7eef3; }
        .error-message { color:#a83d36;background:#fff0ee;padding:12px;border:1px solid #f4d0cb;border-radius:8px;font-size:13px;margin:12px 0; }
        .modal-backdrop { position:fixed;inset:0;background:rgba(34,57,77,.42);display:flex;align-items:center;justify-content:center;padding:16px;z-index:10; }
        .success-modal { background:#fff;width:100%;max-width:430px;padding:28px;border:1px solid #e0edf5;border-radius:18px;text-align:center;box-shadow:0 20px 50px #29445d25; }
        .success-icon { font-size:48px;color:#269b68; }
        .summary { background:#f5f9fc;padding:14px;border:1px solid #e6eef4;border-radius:9px;text-align:left;font-size:12px;line-height:2;margin:18px 0; }
        .modal-button { width:100%;background:#2789bd;color:white;border:0;padding:12px;border-radius:9px;font:inherit;cursor:pointer;font-weight:700; }
        @media(max-width:650px) { .feedback-page{padding:14px 9px;align-items:flex-start}.feedback-header{padding:66px 15px 22px}.language-control{left:50%;right:auto;transform:translateX(-50%);top:13px;white-space:nowrap}.metadata{grid-template-columns:1fr}.legend{grid-template-columns:1fr}.feedback-content{padding:17px}.rating-grid{gap:3px}.rating{padding:11px 0;font-size:12px}.feedback-header h1{font-size:23px}.question-title{font-size:14px} }
      `}</style>

      <div className="feedback-card">
        <header className="feedback-header">
          <div className="language-control">
            <span>{t.selectLang}</span>
            <select value={language} onChange={(e) => { setLanguage(e.target.value); setError(""); }} aria-label={t.selectLang}>
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
              <option value="om">Afaan Oromoo</option>
            </select>
          </div>
          <div className="rv-logo">RV</div>
          <h1>ሪፍት ቫሊ ሆቴል</h1>
          <p>RIFT VALLEY HOTEL • ADAMA</p>
          <div style={{width:58,height:3,background:"#63acd6",margin:"14px auto",borderRadius:3}} />
          <h2>{t.title}</h2>
        </header>

        <div className="feedback-content">
          <div className="intro">{t.welcome}</div>
          <form onSubmit={submitFeedback}>
            <div className="metadata">
              <div className="field"><label>{t.date}</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
              <div className="field"><label>{t.room} <span className="muted">({t.optional})</span></label><input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="204" /></div>
              <div className="field"><label>{t.hall} <span className="muted">({t.optional})</span></label><input value={hall} onChange={(e) => setHall(e.target.value)} placeholder="A" /></div>
            </div>

            <section className="question">
              <div className="question-title">{t.q1}</div>
              <p className="muted">{t.choose}</p>
              <div className="legend">
                <div>🔴 <strong>0–5:</strong> {t.poor}</div>
                <div>🟠 <strong>6–7:</strong> {t.neutral}</div>
                <div>🟢 <strong>8–10:</strong> {t.likely}</div>
              </div>
              <div className="rating-grid">
                {Array.from({length:11},(_,i) => {
                  const type = i <= 5 ? "low" : i <= 7 ? "mid" : "high";
                  return <button key={i} type="button" aria-pressed={score===i} className={`rating ${type} ${score===i?"selected":""}`} onClick={() => setScore(i)}>{i}</button>;
                })}
              </div>
              {score !== null && <div className={`rating-message ${score<=5?"low":score<=7?"mid":"high"}`}>{ratingMessage}</div>}
            </section>

            <section className="question">
              <div className="question-title">{t.q2}</div>
              <p style={{fontSize:13,lineHeight:1.9,color:"#647b8e"}}>{t.q2help}</p>
              <div className="tag-list">
                {tagsForLanguage.map((tag) => <button className="tag-button" type="button" key={tag} onClick={() => addTag(tag)}>+ {tag}</button>)}
              </div>
              <textarea className="feedback-textarea" value={comments} onChange={(e) => setComments(e.target.value)} placeholder={t.comment} required />
            </section>

            {error && <div className="error-message">{error}</div>}
            <div style={{borderTop:"1px solid #e5edf3",paddingTop:20,marginTop:25}}>
              <p style={{textAlign:"center",fontWeight:700,fontSize:13,marginBottom:18,color:"#657b8e"}}>{t.thanks}</p>
              <button className="submit-button" type="submit" disabled={loading}>{loading ? t.sending : `✉  ${t.send}`}</button>
            </div>
          </form>
        </div>
        <footer className="feedback-footer">{t.approved}: <strong style={{color:"#526d82"}}>{t.management}</strong></footer>
      </div>

      {success && <div className="modal-backdrop"><div className="success-modal">
        <div className="success-icon">✓</div>
        <h2>{t.successTitle}</h2>
        <p style={{fontSize:13,color:"#718496",lineHeight:1.8}}>{t.successText}</p>
        <div className="summary">
          <div><strong>{t.score}:</strong> {score} / 10</div>
          <div><strong>{t.sentDate}:</strong> {date}</div>
          <div><strong>{t.roomHall}:</strong> {room || hall ? `${room ? room : ""}${room && hall ? " / " : ""}${hall}` : t.notProvided}</div>
        </div>
        <button className="modal-button" onClick={resetForm}>{t.ok}</button>
      </div></div>}
    </main>
  );
}

export default function App() {
  const path = window.location.pathname;
  if (path === "/admin" || path.startsWith("/admin/")) return <Admin />;
  return <CustomerFeedback />;
}
