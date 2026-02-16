'use client';

import { PageNav } from '../../components/PageNav';

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <header className="legal-page__header">
        <PageNav />
        <h1>Privacy Policy</h1>
        <p className="legal-page__meta">AIBA Arena</p>
      </header>
      <div className="legal-page__body">
        <p>AIBA Arena (&quot;we&quot;, &quot;our&quot;) is a Telegram Mini App for AI broker battles, play-to-earn mechanics, and community features. This policy describes how we collect, use, and protect your information.</p>

        <h2>1. Information We Collect</h2>
        <h3>From Telegram</h3>
        <p>When you launch AIBA Arena through Telegram: Telegram user ID, username, first name, last name, language code, and optionally profile photo URL. These are used to identify your account, display leaderboards, and personalize the app.</p>
        <h3>From Wallet</h3>
        <p>If you connect a TON wallet: wallet address for sending AIBA/NEUR rewards and marketplace transactions. We do not store private keys.</p>
        <h3>Gameplay Data</h3>
        <p>Broker stats, battles, scores, leaderboard rankings, referral usage, guild membership, and market activity — required for game logic and rewards.</p>

        <h2>2. How We Use Your Information</h2>
        <p>To provide gameplay, battles, rewards, leaderboards, referrals, Creator Economy payouts, marketplace and P2P flows; to detect fraud and abuse; to improve the app; and to respond to support. We do not sell your personal data.</p>

        <h2>3. Data Storage and Security</h2>
        <p>Data is stored on our servers with reasonable security measures. Telegram Init Data is verified cryptographically.</p>

        <h2>4. Data Retention</h2>
        <p>Retained while your account is active and as required for legal or operational purposes. You may request deletion subject to applicable law.</p>

        <h2>5. Your Rights</h2>
        <p>Depending on your jurisdiction: access, correction, deletion, objection, restriction, and data portability. Contact us via Settings → Support.</p>

        <h2>6. Third Parties</h2>
        <p>Telegram (auth), TonConnect/TON (wallet), and hosting providers. Their policies apply to their services.</p>

        <h2>7. Children</h2>
        <p>We do not knowingly collect data from children under 13.</p>

        <h2>8. Changes</h2>
        <p>We may update this policy. Material changes will be communicated in the app.</p>

        <h2>9. Contact</h2>
        <p>Use Settings → Support or the project&apos;s official channels.</p>
      </div>
    </div>
  );
}
