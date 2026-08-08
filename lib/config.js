// Milaap app — support & payment config
// Phase 3 (Wallet/Recharge) aur Help screen mein ye values use hongi.
// Yahan sirf DISPLAY ke liye numbers hain — asal payment verification
// hamesha backend/admin panel se manually confirm honi chahiye, kabhi
// bhi sirf frontend pe trust na karein.

export const SUPPORT_CONFIG = {
  supportEmail: "abdulhadi7888888@gmail.com",
  supportWhatsapp: "+923134586476", // "Help" section me dikhaya jayega
  paymentWhatsapp: "+923244996576", // Recharge confirm karne ke liye
  paymentRecipientName: "Qasim Raza",
  paymentMethods: [
    { name: "JazzCash", number: "03244996576" },
    { name: "Easypaisa", number: "03244996576" },
  ],
};

// Admin Panel access — sirf ye emails /admin khol sakte hain.
// Firestore rules mein bhi yehi list use hoti hai (firestore.rules dekhein),
// isliye dono jagah ek saath update karein agar naya admin add karna ho.
export const ADMIN_EMAILS = ["abdulhadi7888888@gmail.com"];

// Coin / Diamond economy.
// Internal-only conversion — never surfaced in any UI/text, receiver
// just sees their diamonds balance go up when a gift lands.
//   • GIFT_DIAMOND_RATE → sender spends 14000 coins on a gift, receiver
//     earns 2800 diamonds (rate = 2800/14000 = 1/5 — every 5 coins spent
//     = 1 diamond for the receiver). Isse related koi bhi label, tooltip
//     ya help text app mein kahin show nahi karna.
//   • DIAMOND_WITHDRAW_RATE_RS → 1 diamond withdraw karne par host ko
//     kitne Rs milte hain (currently set to Rs 2 per diamond)
export const GIFT_DIAMOND_RATE = 2800 / 14000; // = 1/5
export const DIAMOND_WITHDRAW_RATE_RS = 2;
export const MIN_WITHDRAW_DIAMONDS = 1000; // TikTok jaisa hi minimum cashout threshold

// Diamond → Coin exchange (in-app only, no real money, so no admin approval
// needed — unlike recharge/withdraw). Rate is the exact inverse of
// GIFT_DIAMOND_RATE, so a host who converts diamonds back to coins and
// re-gifts them isn't gaining or losing extra value beyond whatever cut
// was already taken at gift time.
export const DIAMOND_TO_COIN_RATE = 14000 / 2800; // = 5
export const MIN_EXCHANGE_DIAMONDS = 10;
