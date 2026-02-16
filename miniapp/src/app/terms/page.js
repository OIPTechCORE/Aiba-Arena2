'use client';

import { PageNav } from '../../components/PageNav';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-page__header">
        <PageNav />
        <h1>Terms of Service</h1>
        <p className="legal-page__meta">AIBA Arena</p>
      </header>
      <div className="legal-page__body">
        <p>By using AIBA Arena, you agree to these Terms of Service.</p>

        <h2>1. Acceptance</h2>
        <p>Use of the app constitutes acceptance. If you do not agree, do not use the app.</p>

        <h2>2. Description</h2>
        <p>AIBA Arena offers AI broker battles, play-to-earn mechanics (AIBA, NEUR, Stars, Diamonds), marketplace, P2P, donations, guilds, tournaments, Creator Economy, and NFT features.</p>

        <h2>3. No Guaranteed Profits or Returns — Important Disclaimer</h2>
        <div className="legal-page__disclaimer">
          <p><strong>Rewards are not guaranteed.</strong> AIBA, NEUR, Stars, Diamonds and other rewards depend on your gameplay, performance, and participation. Past or displayed rewards do not guarantee future earnings.</p>
          <p><strong>No financial advice.</strong> The app does not provide financial, investment, or legal advice. AIBA and NEUR may have no or fluctuating value. You bear all risk.</p>
          <p><strong>No guaranteed liquidity.</strong> You may not be able to convert tokens at any particular price or at all. Participation is voluntary.</p>
        </div>

        <h2>4. Eligibility</h2>
        <p>You must be of legal age and comply with Telegram&apos;s terms. You are responsible for keeping your account and wallet secure.</p>

        <h2>5. User Conduct</h2>
        <p>You agree not to cheat, exploit, harass others, or violate laws. Violations may result in suspension or bans.</p>

        <h2>6. Tokens and Economy</h2>
        <p>AIBA, NEUR, Stars, Diamonds are in-app or on-chain tokens. We may adjust rates and parameters. Wallet connection may be required for certain features.</p>

        <h2>7. Intellectual Property</h2>
        <p>The app and branding are owned by the project. You receive a limited license to use the app as intended.</p>

        <h2>8. Disclaimers</h2>
        <p>THE APP IS PROVIDED &quot;AS IS&quot;. WE DISCLAIM ALL WARRANTIES. WE ARE NOT LIABLE FOR LOSS OF FUNDS, TOKENS, OR DATA.</p>

        <h2>9. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, our liability is limited. We are not liable for indirect or consequential damages.</p>

        <h2>10. Indemnification</h2>
        <p>You agree to indemnify us from claims arising from your use or violation of these Terms.</p>

        <h2>11. Termination</h2>
        <p>We may suspend or terminate access for violations or operational reasons. You may stop using the app at any time.</p>

        <h2>12. Changes</h2>
        <p>We may update these Terms. Material changes will be communicated in the app. Continued use constitutes acceptance.</p>

        <h2>13. Contact</h2>
        <p>Use Settings → Support or the project&apos;s official channels.</p>
      </div>
    </div>
  );
}
