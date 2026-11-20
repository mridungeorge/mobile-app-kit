const features = [
  {
    title: "Send in seconds",
    body: "Draft, review and send a branded invoice without leaving the keyboard.",
  },
  {
    title: "Know what is late",
    body: "A single ledger shows paid, due and overdue without a spreadsheet.",
  },
  {
    title: "Books that reconcile",
    body: "Every payment is matched to an invoice and exported to your accountant.",
  },
];

export default function App() {
  return (
    <main>
      <header className="nav">
        <a className="brand" href="#top">
          Ledgerly
        </a>
        <nav aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">Invoicing for small studios</p>
        <h1 data-hero>Send the invoice. Skip the spreadsheet.</h1>
        <p className="lede" data-hero>
          Ledgerly keeps every invoice, payment and reminder in one calm place, so the
          admin fits into a coffee break.
        </p>
        <div className="actions" data-hero>
          <a className="button" href="#pricing">
            Start free
          </a>
          <a className="link" href="#features">
            See how it works
          </a>
        </div>
      </section>

      <section className="features" id="features" aria-label="Features">
        {features.map((feature) => (
          <article className="card" data-reveal key={feature.title}>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="proof" id="pricing" data-reveal>
        <h2>One price, every client</h2>
        <p>
          $12 a month for unlimited invoices, reminders and exports. No per-seat maths,
          no setup call.
        </p>
      </section>
    </main>
  );
}
