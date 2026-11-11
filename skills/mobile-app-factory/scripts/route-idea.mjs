#!/usr/bin/env node
// Idea router — classifies an app idea into an archetype profile for the Mobile App Factory.
// Dependency-free and deterministic: same input, same profile. No network, no model call.
//
// Usage:
//   node scripts/route-idea.mjs "a sleep tracker with white noise"
//   node scripts/route-idea.mjs --json "marketplace for dog walkers" > .mobile/00-profile.json
//   node scripts/route-idea.mjs --summary "offline bird identifier"
//   node scripts/route-idea.mjs --archetype fintech --monetisation subscription "budgeting app"
//
// Flags:
//   --json                 emit the profile JSON (default when piped)
//   --summary              emit a short human-readable summary
//   --out <path>           write the profile JSON to a file
//   --archetype <name>     force the primary archetype
//   --stack <name>         native | android-native | ios-native | kmp | flutter | expo | capacitor
//   --monetisation <name>  free | iap | subscription | ads | contract | none
//   --accounts / --no-accounts
//   --ugc / --no-ugc
//   --ai / --no-ai
//   --offline
//   --help

import { writeFileSync } from "node:fs";

const ARCHETYPES = {
  "utility": {
    label: "Utility / tool",
    keywords: [
      ["calculator", 3], ["converter", 3], ["unit convert", 3], ["scanner", 3], ["scan", 2],
      ["qr", 2], ["barcode", 2], ["notes", 2], ["note taking", 3], ["timer", 2], ["stopwatch", 3],
      ["flashlight", 3], ["measure", 2], ["ruler", 3], ["dictionary", 3], ["offline reference", 3],
      ["file manager", 3], ["clipboard", 3], ["password manager", 3], ["rename", 2], ["compress", 2],
      ["pdf tool", 3], ["translate", 2], ["widget", 1], ["single purpose", 2],
      ["weather", 3], ["forecast", 2], ["air quality", 3], ["monitor", 1]
    ],
    coreLoop: "open the tool → perform the one task → save, copy, or share the result",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state", data: "sqlite-room-coredata", backend: "none", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["home-tool", "history", "detail", "settings", "paywall"],
    dataSensitivity: [],
    permissions: [],
    accounts: false, ugc: false, aiGeneratedContent: false,
    payments: ["iap"], monetisation: "one-time unlock",
    ios: { declarations: ["privacy-manifest"], ageRatingFloor: "4+", reviewRisks: ["4.2 thin functionality", "2.3 misleading metadata", "3.1.1 external purchase link"] },
    android: { declarations: ["data-safety"], contentRatingFloor: "Everyone", reviewRisks: ["minimum functionality", "misleading store listing", "billing policy"] },
    motionBudget: "restrained",
    qaFocus: ["offline behaviour", "large or malformed input", "permission-denied path", "export and share output"],
    metadataHints: { subtitle: "the task in five words", keywords: ["scanner", "converter", "offline", "simple", "fast"], category: { ios: "Utilities", android: "Tools" } }
  },

  "health-fitness": {
    label: "Health & fitness",
    keywords: [
      ["sleep", 3], ["insomnia", 3], ["white noise", 2], ["workout", 3], ["fitness", 3], ["exercise", 2],
      ["gym", 2], ["running", 2], ["run tracker", 3], ["step", 2], ["calorie", 3], ["nutrition", 3],
      ["diet", 2], ["meal", 1], ["meditation", 3], ["mindfulness", 3], ["breath", 2], ["symptom", 3],
      ["period", 3], ["cycle", 2], ["pregnan", 3], ["rehab", 3], ["physio", 3], ["mental health", 3],
      ["mood", 2], ["journal", 1], ["hydration", 3], ["water intake", 3], ["health", 2], ["heart rate", 3],
      ["blood pressure", 3], ["diabetes", 3], ["therapy", 2], ["habit", 1]
    ],
    coreLoop: "log or import a measurement → see today → see a trend → adjust",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state", data: "sqlite-room-datastore", backend: "supabase", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["onboarding-consent", "today", "log-entry", "history", "trends", "detail", "settings", "export", "paywall"],
    dataSensitivity: ["health"],
    permissions: ["notifications", "health-kit"],
    accounts: true, ugc: false, aiGeneratedContent: false,
    payments: ["subscription"], monetisation: "subscription",
    ios: { declarations: ["healthkit-entitlement", "privacy-manifest", "purpose-strings"], ageRatingFloor: "13+", reviewRisks: ["1.4.1 medical claims", "5.1.3 health data misuse", "diagnose/treat/cure copy", "missing export or delete"] },
    android: { declarations: ["health-connect", "data-safety", "sensitive-data"], contentRatingFloor: "Teen", reviewRisks: ["health misinformation", "sensitive data policy", "missing account deletion"] },
    motionBudget: "restrained",
    qaFocus: ["units and time zones", "import dedupe", "empty history", "export integrity", "permission denial", "chart values readable as text"],
    metadataHints: { subtitle: "what the user tracks, not a cure", keywords: ["sleep", "tracker", "health", "trends", "insights"], category: { ios: "Health & Fitness", android: "Health & Fitness" } }
  },

  "social-ugc": {
    label: "Social / user-generated content",
    keywords: [
      ["social", 2], ["feed", 2], ["community", 2], ["forum", 3], ["post", 2], ["share photos", 3],
      ["photo sharing", 3], ["friends", 2], ["follow", 3], ["followers", 3], ["comment", 2],
      ["likes", 2], ["messaging", 2], ["chat", 2], ["dm", 2], ["reviews", 2], ["review app", 2],
      ["ugc", 3], ["user generated", 3], ["moderation", 2], ["report user", 2], ["block user", 2],
      ["creator", 2], ["influencer", 2], ["memes", 3], ["confession", 2], ["anonymous", 2],
      ["neighbourhood", 1], ["club", 1], ["meetup", 1], ["fan", 1]
    ],
    coreLoop: "create or browse → interact → return for new content",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state-network", data: "supabase-sdk", backend: "supabase", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["auth", "feed", "compose", "post-detail", "comments", "profile", "search", "notifications", "report-block", "settings"],
    dataSensitivity: ["account", "photos"],
    permissions: ["photos", "notifications"],
    accounts: true, ugc: true, aiGeneratedContent: false,
    payments: ["subscription", "ads"], monetisation: "subscription or ads",
    ios: { declarations: ["ugc-1.2", "account-deletion", "privacy-manifest", "dsa-trader"], ageRatingFloor: "13+", reviewRisks: ["1.2 missing filtering/reporting/blocking", "5.1.1 account deletion", "1.6 data collection", "2.1 placeholder content"] },
    android: { declarations: ["ugc-policy", "child-safety-standards", "data-safety", "account-deletion"], contentRatingFloor: "Teen", reviewRisks: ["UGC moderation", "child safety standards", "data safety mismatch"] },
    motionBudget: "standard",
    qaFocus: ["report → block → hide flow", "blocked users invisible everywhere", "deep link to deleted content", "offline compose queue", "image upload failure"],
    metadataHints: { subtitle: "the community in five words", keywords: ["community", "share", "discover", "social", "feed"], category: { ios: "Social Networking", android: "Social" } }
  },

  "commerce-marketplace": {
    label: "Commerce / marketplace",
    keywords: [
      ["shop", 3], ["store", 2], ["ecommerce", 3], ["e-commerce", 3], ["cart", 3], ["checkout", 3],
      ["marketplace", 3], ["buy", 2], ["sell", 2], ["product", 2], ["catalogue", 2], ["catalog", 2],
      ["order", 2], ["delivery", 1], ["booking", 2], ["appointment", 2], ["reservation", 2],
      ["subscription box", 3], ["auction", 3], ["bidding", 2], ["vendor", 3], ["merchant", 3],
      ["payments", 2], ["stripe", 2], ["shopify", 3], ["retail", 3], ["fashion", 1], ["sneaker", 1],
      ["furniture", 1], ["grocery", 2], ["takeaway", 1], ["menu", 1]
    ],
    coreLoop: "discover → detail → cart or booking → pay → track",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state-network", data: "remote-api-cache", backend: "shopify-or-medusa", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["home", "category", "search", "product", "cart", "checkout", "confirmation", "orders", "order-detail", "account", "addresses", "support"],
    dataSensitivity: ["payment", "address", "purchase-history"],
    permissions: ["notifications"],
    accounts: true, ugc: false, aiGeneratedContent: false,
    payments: ["stripe", "iap"], monetisation: "transaction fee or subscription",
    ios: { declarations: ["3.1.1-payments", "privacy-manifest", "tracking-transparency", "account-deletion"], ageRatingFloor: "4+", reviewRisks: ["3.1.1 wrong payment path", "2.1 incomplete catalogue", "5.1.1 account deletion", "misleading pricing"] },
    android: { declarations: ["payments-policy", "data-safety", "account-deletion"], contentRatingFloor: "Everyone", reviewRisks: ["Play billing policy", "misleading pricing", "incomplete listing"] },
    motionBudget: "standard",
    qaFocus: ["price/tax/currency", "out-of-stock", "payment failure", "refund path", "order state transitions", "guest checkout"],
    metadataHints: { subtitle: "what you sell and to whom", keywords: ["shop", "buy", "delivery", "deals", "marketplace"], category: { ios: "Shopping", android: "Shopping" } }
  },

  "media": {
    label: "Media / content",
    keywords: [
      ["music", 3], ["podcast", 3], ["audio book", 3], ["audiobook", 3], ["radio", 2], ["stream", 2],
      ["streaming", 3], ["video", 2], ["movie", 2], ["film", 1], ["tv", 1], ["player", 2],
      ["playlist", 3], ["reading", 2], ["reader", 2], ["ebook", 3], ["book", 1], ["comic", 2],
      ["manga", 3], ["gallery", 2], ["photo album", 2], ["wallpaper", 2], ["news", 2], ["magazine", 2],
      ["learn to play", 1], ["course", 1], ["lecture", 1], ["dj", 2], ["lo-fi", 2], ["white noise", 1]
    ],
    coreLoop: "browse → play or read → resume → collect",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state", data: "sqlite-room-coredata", backend: "cdn", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["home", "library", "player-reader", "queue", "search", "detail", "downloads", "settings", "paywall"],
    dataSensitivity: ["account", "consumption-history"],
    permissions: ["notifications", "background-audio"],
    accounts: true, ugc: false, aiGeneratedContent: false,
    payments: ["subscription", "ads"], monetisation: "subscription or ads",
    ios: { declarations: ["2.5.2-background-audio", "3.1.1-payments", "privacy-manifest"], ageRatingFloor: "4+", reviewRisks: ["unlicensed content", "2.5.2 background mode misuse", "4.2 thin functionality"] },
    android: { declarations: ["foreground-media-service", "data-safety"], contentRatingFloor: "Everyone", reviewRisks: ["background playback policy", "content licensing", "data safety mismatch"] },
    motionBudget: "expressive",
    qaFocus: ["interruption handling", "resume position", "offline downloads", "lock-screen controls", "background battery drain"],
    metadataHints: { subtitle: "what you can play or read", keywords: ["listen", "stream", "offline", "playlist", "library"], category: { ios: "Music", android: "Music & Audio" } }
  },

  "ai-assistant": {
    label: "AI assistant",
    keywords: [
      ["ai", 3], ["artificial intelligence", 3], ["chatbot", 3], ["chat bot", 3], ["gpt", 3], ["llm", 3],
      ["assistant", 2], ["generate", 3], ["generator", 2], ["summarise", 3], ["summarize", 3],
      ["writing helper", 3], ["rewrite", 2], ["prompt", 3], ["image generation", 3], ["ai image", 3],
      ["transcribe", 3], ["transcription", 3], ["translate with ai", 2], ["coach", 1], ["tutor", 2],
      ["journal with ai", 3], ["voice note", 1], ["vision", 1], ["rag", 2], ["agent", 2], ["copilot", 3]
    ],
    coreLoop: "prompt or capture → generated result → refine → save or export",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state-network", data: "sqlite-room-coredata", backend: "serverless-proxy", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["onboarding-disclosure", "compose-chat", "result", "history", "detail", "settings", "usage-limits", "paywall"],
    dataSensitivity: ["prompts", "account"],
    permissions: ["notifications"],
    accounts: true, ugc: true, aiGeneratedContent: true,
    payments: ["subscription"], monetisation: "subscription with visible limits",
    ios: { declarations: ["1.2-ai-output", "5.1.2-third-party-ai", "privacy-manifest", "account-deletion"], ageRatingFloor: "13+", reviewRisks: ["1.2 unfiltered output", "5.1.2 undisclosed data sharing", "4.2 wrapper app", "hallucinated professional advice"] },
    android: { declarations: ["generative-ai-policy", "data-safety", "account-deletion"], contentRatingFloor: "Teen", reviewRisks: ["AI content reporting", "safety filters", "data safety mismatch", "misleading capability claims"] },
    motionBudget: "standard",
    qaFocus: ["refusal path", "report flow", "rate-limit UX", "streaming cancel", "offline queue", "per-user cost runaway", "prompt-injection handling"],
    metadataHints: { subtitle: "the job it does, not the model", keywords: ["ai", "assistant", "generate", "summarise", "productivity"], category: { ios: "Productivity", android: "Productivity" } }
  },

  "fintech": {
    label: "Finance / fintech",
    keywords: [
      ["bank", 3], ["banking", 3], ["budget", 3], ["budgeting", 3], ["expense", 3], ["spending", 2],
      ["invoice", 3], ["invoicing", 3], ["accounting", 3], ["tax", 2], ["receipt", 2], ["portfolio", 3],
      ["invest", 2], ["investment", 3], ["stock", 2], ["crypto", 3], ["bitcoin", 3], ["wallet", 3],
      ["payment app", 3], ["pay someone", 2], ["loan", 2], ["credit score", 3], ["savings", 2],
      ["net worth", 3], ["subscriptions tracker", 2], ["split bill", 2], ["remittance", 3], ["fintech", 3]
    ],
    coreLoop: "connect or enter → categorise → see balance or trend → act or export",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state-network", data: "encrypted-sqlite-room-keystore", backend: "bank-api", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["onboarding-kyc", "accounts", "transactions", "detail", "budgets", "trends", "settings", "security", "export", "support"],
    dataSensitivity: ["financial", "identity", "authentication"],
    permissions: ["notifications", "biometrics"],
    accounts: true, ugc: false, aiGeneratedContent: false,
    payments: ["subscription"], monetisation: "subscription or per-transaction",
    ios: { declarations: ["3.1.1-payments", "5.1.1-data", "privacy-manifest", "account-deletion", "financial-services-review"], ageRatingFloor: "18+", reviewRisks: ["regulatory licensing", "2.1 missing demo account", "5.1.1 data handling", "misleading financial claims"] },
    android: { declarations: ["financial-services-policy", "data-safety", "account-deletion"], contentRatingFloor: "Mature", reviewRisks: ["financial services declaration", "misleading claims", "sensitive permissions"] },
    motionBudget: "restrained",
    qaFocus: ["rounding and currency", "transaction time zones", "demo account for review", "biometric fallback", "session timeout", "export accuracy"],
    metadataHints: { subtitle: "the money job, without promises", keywords: ["budget", "expenses", "track", "savings", "money"], category: { ios: "Finance", android: "Finance" } }
  },

  "kids-family": {
    label: "Kids / family",
    keywords: [
      ["kids", 3], ["children", 3], ["child", 3], ["toddler", 3], ["preschool", 3], ["bedtime", 3],
      ["story for kids", 3], ["homework", 2], ["tutoring", 3], ["tutor", 2], ["learning", 2],
      ["alphabet", 3], ["phonics", 3], ["math practice", 3], ["chores", 3], ["parental control", 3],
      ["parent", 2], ["family", 2], ["baby", 3], ["nursery", 2], ["school", 2], ["classroom", 2],
      ["flashcard", 2], ["reward chart", 3], ["screen time", 3]
    ],
    coreLoop: "child completes an activity → earns progress → parent sees it",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state", data: "sqlite-room-coredata", backend: "none", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["parent-gate", "child-home", "activity", "reward-progress", "parent-dashboard", "settings", "privacy-notice"],
    dataSensitivity: ["children", "account"],
    permissions: ["notifications"],
    accounts: false, ugc: false, aiGeneratedContent: false,
    payments: ["subscription", "iap"], monetisation: "one-time or subscription behind parent gate",
    ios: { declarations: ["kids-category", "1.3", "5.1.4", "privacy-manifest"], ageRatingFloor: "4+", reviewRisks: ["1.3 Kids Category violations", "5.1.4 child data", "ads or analytics in child experience", "external links behind gate"] },
    android: { declarations: ["families-policy", "designed-for-families", "data-safety"], contentRatingFloor: "Everyone", reviewRisks: ["Play Families policy", "ads in child experience", "child data collection"] },
    motionBudget: "expressive",
    qaFocus: ["parental gate strength", "no data leaves device without consent", "offline play", "no dark patterns", "no unmoderated chat"],
    metadataHints: { subtitle: "the learning outcome", keywords: ["kids", "learn", "phonics", "bedtime", "family"], category: { ios: "Education", android: "Education" } }
  },

  "travel-maps": {
    label: "Travel / maps",
    keywords: [
      ["travel", 3], ["trip", 2], ["itinerary", 3], ["map", 3], ["maps", 3], ["navigation", 3],
      ["navigate", 2], ["transit", 3], ["train", 2], ["flight", 2], ["hotel", 2], ["hostel", 2],
      ["city guide", 3], ["guidebook", 3], ["local discovery", 3], ["nearby", 2], ["restaurant finder", 3],
      ["hiking", 2], ["trail", 2], ["camping", 2], ["tourist", 3], ["sightseeing", 3], ["offline map", 3],
      ["parking", 2], ["ev charging", 2], ["geocach", 2], ["road trip", 3]
    ],
    coreLoop: "choose a place → see it on map or list → save or navigate → use offline",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state", data: "sqlite-room-coredata", backend: "maplibre", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["onboarding-location", "discover", "map", "place-detail", "itinerary", "saved", "offline-downloads", "settings"],
    dataSensitivity: ["location", "travel-plans"],
    permissions: ["location-when-in-use", "notifications"],
    accounts: false, ugc: false, aiGeneratedContent: false,
    payments: ["subscription"], monetisation: "subscription for offline/guides, disclosed affiliates",
    ios: { declarations: ["5.1.1-location", "5.1.5", "privacy-manifest"], ageRatingFloor: "4+", reviewRisks: ["vague location purpose", "background location overreach", "misleading offline claims"] },
    android: { declarations: ["location-declaration", "data-safety"], contentRatingFloor: "Everyone", reviewRisks: ["sensitive-permission rejection", "offline claims", "location data sharing"] },
    motionBudget: "standard",
    qaFocus: ["permission denial with manual entry", "offline map integrity", "background battery", "timezone and transit changes", "deep link to a place"],
    metadataHints: { subtitle: "where it works and what is offline", keywords: ["travel", "map", "offline", "guide", "nearby"], category: { ios: "Travel", android: "Travel & Local" } }
  },

  "b2b-field": {
    label: "B2B / field operations",
    keywords: [
      ["field service", 3], ["field ops", 3], ["inspection", 3], ["audit", 2], ["inventory", 3],
      ["stocktake", 3], ["warehouse", 3], ["logistics", 2], ["crm", 3], ["sales rep", 3],
      ["b2b", 3], ["enterprise", 2], ["employee", 2], ["staff", 2], ["shift", 2], ["timesheet", 3],
      ["work order", 3], ["job site", 3], ["site survey", 3], ["compliance checklist", 2],
      ["asset tracking", 3], ["fleet", 3], ["dispatch", 3], ["maintenance", 2], ["technician", 3],
      ["sso", 2], ["saml", 2], ["mdm", 2], ["managed google play", 3]
    ],
    coreLoop: "sign in → receive assignment → capture evidence → sync → report",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state-network", data: "offline-queue-room-coredata", backend: "enterprise-api", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["sso-login", "assignments", "job-detail", "capture", "sync-status", "history", "profile", "settings"],
    dataSensitivity: ["employee", "customer", "site"],
    permissions: ["camera", "location", "notifications"],
    accounts: true, ugc: false, aiGeneratedContent: false,
    payments: ["contract"], monetisation: "per-seat contract outside the stores",
    ios: { declarations: ["5.1.1-data", "privacy-manifest", "business-manager"], ageRatingFloor: "18+", reviewRisks: ["2.1 demo account", "5.1.1 data handling", "4.2 thin consumer value", "MDM misconfiguration"] },
    android: { declarations: ["data-safety", "location-declaration", "managed-play"], contentRatingFloor: "Mature", reviewRisks: ["private distribution setup", "sensitive permissions", "data safety"] },
    motionBudget: "restrained",
    qaFocus: ["offline capture and conflict resolution", "photo compression", "SSO expiry", "geofence accuracy", "shift-length battery", "audit trail"],
    metadataHints: { subtitle: "the operational outcome", keywords: ["field", "inspection", "offline", "team", "workflow"], category: { ios: "Business", android: "Business" } }
  },

  "camera-photo": {
    label: "Camera / photo",
    keywords: [
      ["camera", 3], ["photo", 2], ["picture", 1], ["photo editor", 3], ["photo edit", 3], ["filter", 2], ["preset", 1],
      ["scanner app", 2], ["document scan", 3], ["ocr", 3], ["text recognition", 3], ["ar", 2],
      ["try on", 3], ["virtual try", 3], ["selfie", 2], ["portrait", 1], ["collage", 3],
      ["background remove", 3], ["retouch", 3], ["raw", 2], ["exif", 2], ["lens", 1], ["shutter", 2],
      ["video editor", 3], ["reel", 1], ["green screen", 3], ["identify", 2], ["identifier", 3],
      ["species", 3], ["bird", 1], ["bird identifier", 3], ["plant identifier", 3], ["plant", 1], ["insect", 2], ["mushroom", 2], ["visual search", 3]
    ],
    coreLoop: "capture → process or edit → save and share",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state", data: "sqlite-room-coredata", backend: "on-device-ml", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["camera", "review", "editor", "export-share", "gallery", "settings", "paywall"],
    dataSensitivity: ["photos", "documents"],
    permissions: ["camera", "photos"],
    accounts: false, ugc: false, aiGeneratedContent: false,
    payments: ["iap", "subscription"], monetisation: "one-time unlock or subscription",
    ios: { declarations: ["5.1.1-purpose-strings", "2.5.13-arkit", "privacy-manifest"], ageRatingFloor: "4+", reviewRisks: ["4.2 thin filter app", "2.5.13", "misleading AI claims"] },
    android: { declarations: ["camera-mic-declaration", "photo-video-permissions", "data-safety"], contentRatingFloor: "Everyone", reviewRisks: ["photo permission overreach", "AI claims", "data safety"] },
    motionBudget: "expressive",
    qaFocus: ["capture latency", "orientation and EXIF", "large-image memory", "export colour fidelity", "permission denial", "on-device vs cloud clarity"],
    metadataHints: { subtitle: "the visual outcome", keywords: ["photo", "editor", "scanner", "filters", "camera"], category: { ios: "Photo & Video", android: "Photography" } }
  },

  "game": {
    label: "Game",
    keywords: [
      ["game", 3], ["puzzle", 3], ["arcade", 3], ["platformer", 3], ["roguelike", 3], ["rpg", 3],
      ["shooter", 3], ["racing", 3], ["sports game", 2], ["card game", 3], ["board game", 3],
      ["trivia", 3], ["word game", 3], ["match-3", 3], ["idle game", 3], ["tower defense", 3],
      ["multiplayer", 2], ["leaderboard", 2], ["level", 1], ["quest", 1], ["unity", 3], ["godot", 3],
      ["game center", 2], ["play games", 2], ["battle pass", 3], ["loot box", 3]
    ],
    coreLoop: "start a session → face a challenge → earn a reward → start the next session",
    stack: { primary: "unity", ui: "unity-ui", state: "unity", data: "local-save", backend: "game-backend" },
    screens: ["title", "tutorial", "play", "pause", "results", "shop", "settings", "leaderboard"],
    dataSensitivity: ["account", "purchase-history"],
    permissions: ["notifications"],
    accounts: true, ugc: false, aiGeneratedContent: false,
    payments: ["iap", "ads"], monetisation: "IAP, ads with consent, battle pass",
    ios: { declarations: ["3.1.1-payments", "4.3-spam", "privacy-manifest", "game-center"], ageRatingFloor: "9+", reviewRisks: ["4.3 saturated category", "loot-box odds", "ads to children", "fake gameplay in preview"] },
    android: { declarations: ["iarc-content-rating", "data-safety", "families-policy"], contentRatingFloor: "Everyone", reviewRisks: ["content rating accuracy", "ads policy", "families policy"] },
    motionBudget: "expressive",
    qaFocus: ["frame rate on low-end devices", "save integrity", "interrupt and resume", "purchase restore", "offline behaviour"],
    metadataHints: { subtitle: "genre plus hook", keywords: ["game", "puzzle", "offline", "relaxing", "challenge"], category: { ios: "Games", android: "Games" } }
  },

  "dating": {
    label: "Dating / matching",
    keywords: [
      ["dating", 3], ["date night", 1], ["matchmaking", 3], ["match", 2], ["swipe", 3],
      ["singles", 3], ["romance", 3], ["relationship", 2], ["hookup", 3], ["friendship app", 2],
      ["meet people", 2], ["nearby people", 3], ["profile bio", 2], ["compatibility", 2],
      ["speed dating", 3], ["lgbtq", 2], ["polyamory", 3], ["wingman", 2]
    ],
    coreLoop: "build a profile → discover → match → chat → meet safely",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state-network", data: "supabase-sdk", backend: "supabase", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["onboarding-verification", "profile-builder", "discover", "match", "chat", "report-block", "safety-centre", "settings", "paywall"],
    dataSensitivity: ["identity", "photos", "location", "sexual-orientation"],
    permissions: ["photos", "notifications", "location-coarse"],
    accounts: true, ugc: true, aiGeneratedContent: false,
    payments: ["subscription", "iap"], monetisation: "subscription plus consumables",
    ios: { declarations: ["1.2-ugc", "5.1.1-data", "5.1.4", "dsa-trader", "account-deletion"], ageRatingFloor: "18+", reviewRisks: ["1.2 moderation", "age verification", "5.1.1 sensitive data", "scam and impersonation"] },
    android: { declarations: ["ugc-policy", "dating-policy", "data-safety", "account-deletion"], contentRatingFloor: "Mature", reviewRisks: ["dating policy", "age verification", "sensitive data"] },
    motionBudget: "standard",
    qaFocus: ["report and block immediacy", "photo verification", "location privacy", "screenshot warnings", "account deletion"],
    metadataHints: { subtitle: "safety and intent, not just matching", keywords: ["dating", "meet", "match", "singles", "nearby"], category: { ios: "Social Networking", android: "Social" } }
  },

  "delivery-logistics": {
    label: "Delivery / ride-hailing",
    keywords: [
      ["courier", 3], ["food delivery", 3], ["ride hailing", 3], ["ride-hail", 3], ["taxi", 3],
      ["rideshare", 3], ["driver", 2], ["rider", 2], ["passenger", 3], ["dispatch", 2],
      ["last mile", 3], ["tracking parcel", 3], ["parcel", 2], ["pickup", 2], ["drop off", 2],
      ["fare", 3], ["surge", 2], ["fleet", 2], ["route optimisation", 3], ["proof of delivery", 3],
      ["driver earnings", 3], ["uber for", 3], ["on demand", 2], ["sos", 1]
    ],
    coreLoop: "request → match → track live → complete → rate",
    stack: { primary: "native", ui: "swiftui-compose", state: "platform-state-network", data: "remote-api-cache", backend: "realtime", android: "kotlin-jetpack-compose", ios: "swift-swiftui" },
    screens: ["role-select", "request", "tracking", "chat-call", "history", "receipt", "driver-mode", "earnings", "settings"],
    dataSensitivity: ["location", "payment", "identity"],
    permissions: ["location-background", "notifications", "camera"],
    accounts: true, ugc: false, aiGeneratedContent: false,
    payments: ["stripe-connect"], monetisation: "per-trip fee, subscription, or commission",
    ios: { declarations: ["5.1.1-background-location", "3.1.1-payments", "privacy-manifest", "account-deletion"], ageRatingFloor: "18+", reviewRisks: ["background-location rejection", "data sharing with drivers", "payment compliance", "safety disclosures"] },
    android: { declarations: ["background-location-declaration", "location-video", "data-safety", "account-deletion"], contentRatingFloor: "Mature", reviewRisks: ["location policy", "safety disclosures", "data safety"] },
    motionBudget: "standard",
    qaFocus: ["background location on both OSes", "battery", "offline tracking gaps", "fare calculation", "cancellation and refund", "SOS path"],
    metadataHints: { subtitle: "service plus area", keywords: ["delivery", "tracking", "nearby", "fast", "driver"], category: { ios: "Travel", android: "Maps & Navigation" } }
  }
};

const STACK_PRESETS = {
  native: { primary: "native", ui: "swiftui-compose", androidToolchain: "android-studio-gradle-kotlin", iosToolchain: "xcode-swiftui", build: "gradle-xcode" },
  "android-native": { primary: "android-native", ui: "jetpack-compose", androidToolchain: "android-studio-gradle-kotlin", build: "gradle" },
  "ios-native": { primary: "ios-native", ui: "swiftui", iosToolchain: "xcode-swiftui", build: "xcode" },
  kmp: { primary: "kmp", ui: "compose-multiplatform", androidToolchain: "android-studio-gradle-kotlin", iosToolchain: "xcode-swiftui", build: "gradle-xcode" },
  flutter: { primary: "flutter", ui: "material-3", build: "flutter-gradle-xcode" },
  expo: { primary: "expo", ui: "nativewind", build: "eas", note: "cross-platform JS; not a native Kotlin/Swift codebase" },
  capacitor: { primary: "capacitor", ui: "web", build: "capacitor-gradle-xcode" },
  unity: { primary: "unity", ui: "unity-ui", build: "unity" }
};

const MONETISATION_PAYMENTS = {
  free: [], none: [], iap: ["iap"], subscription: ["subscription"], ads: ["ads"],
  contract: ["contract"], "one-time": ["iap"]
};

const ARCHETYPE_ORDER = Object.keys(ARCHETYPES);

function normalize(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim();
}

// Match a keyword phrase against tokens. Words of 3+ characters also match simple
// derivations ("scan" → "scanner", "map" → "maps"); 1–2 character keywords must match
// exactly so "ai" never fires on "air" and "ar" never fires on "are".
function phraseMatches(tokens, phrase) {
  const parts = phrase.split(" ");
  for (let i = 0; i + parts.length <= tokens.length; i += 1) {
    let ok = true;
    for (let j = 0; j < parts.length; j += 1) {
      const part = parts[j];
      const token = tokens[i + j];
      const hit = token === part || (part.length >= 3 && token.startsWith(part));
      if (!hit) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

function scoreArchetypes(text) {
  const tokens = normalize(text).split(" ").filter(Boolean);
  const scores = {};
  for (const [name, def] of Object.entries(ARCHETYPES)) {
    let score = 0;
    const hits = [];
    for (const [phrase, weight] of def.keywords) {
      if (phraseMatches(tokens, phrase)) {
        score += weight;
        hits.push(phrase);
      }
    }
    scores[name] = { score, hits };
  }
  return scores;
}

function parseArgs(argv) {
  const opts = { words: [], json: false, summary: false, out: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} needs a value`);
      i += 1;
      return value;
    };
    switch (arg) {
      case "--json": opts.json = true; break;
      case "--summary": opts.summary = true; break;
      case "--help": case "-h": opts.help = true; break;
      case "--out": opts.out = next(); break;
      case "--archetype": opts.archetype = next(); break;
      case "--stack": opts.stack = next(); break;
      case "--monetisation": case "--monetization": opts.monetisation = next(); break;
      case "--accounts": opts.accounts = true; break;
      case "--no-accounts": opts.accounts = false; break;
      case "--ugc": opts.ugc = true; break;
      case "--no-ugc": opts.ugc = false; break;
      case "--ai": opts.ai = true; break;
      case "--no-ai": opts.ai = false; break;
      case "--offline": opts.offline = true; break;
      default:
        if (arg.startsWith("--")) throw new Error(`unknown flag ${arg}`);
        opts.words.push(arg);
    }
  }
  return opts;
}

function help() {
  return `Idea router — classify an app idea for the Mobile App Factory.

  node scripts/route-idea.mjs "a sleep tracker with white noise"
  node scripts/route-idea.mjs --json "marketplace for dog walkers" > .mobile/00-profile.json
  node scripts/route-idea.mjs --summary "offline bird identifier"

Flags: --json --summary --out <path> --archetype <name> --stack <native|android-native|ios-native|kmp|flutter|expo|capacitor|unity>
       --monetisation <free|iap|subscription|ads|contract|none> --accounts --no-accounts
       --ugc --no-ugc --ai --no-ai --offline

Archetypes: ${ARCHETYPE_ORDER.join(", ")}`;
}

export function routeIdea(idea, overrides = {}) {
  if (!idea || !String(idea).trim()) throw new Error("give the router an app idea, e.g. \"a sleep tracker\"");
  const scores = scoreArchetypes(idea);
  const ranked = Object.entries(scores)
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.score - a.score || ARCHETYPE_ORDER.indexOf(a.name) - ARCHETYPE_ORDER.indexOf(b.name));

  let primary = ranked[0].score > 0 ? ranked[0].name : "utility";
  if (overrides.archetype) {
    if (!ARCHETYPES[overrides.archetype]) throw new Error(`unknown archetype "${overrides.archetype}". Try: ${ARCHETYPE_ORDER.join(", ")}`);
    primary = overrides.archetype;
  }

  const def = ARCHETYPES[primary];
  const top = scores[primary].score;
  const second = ranked.find((entry) => entry.name !== primary) || { name: null, score: 0 };
  const secondary = ranked
    .filter((entry) => entry.name !== primary && entry.score >= Math.max(2, Math.ceil(top * 0.45)))
    .slice(0, 2)
    .map((entry) => entry.name);

  let confidence = "low";
  if (top >= 5 && top - second.score >= 2) confidence = "high";
  else if (top >= 3) confidence = "medium";
  if (overrides.archetype) confidence = "high";

  // Text-derived capability detection fills gaps the archetype may not imply.
  const tokens = normalize(idea).split(" ").filter(Boolean);
  const mentions = (...terms) => terms.some((term) => phraseMatches(tokens, term));
  const permissions = new Set(def.permissions);
  if (mentions("camera", "scan", "photo", "qr", "barcode", "receipt") && !permissions.has("camera")) permissions.add("camera");
  if (mentions("location", "map", "nearby", "gps", "navigation", "delivery", "driver")) {
    permissions.add(mentions("background", "driver", "courier") ? "location-background" : "location-when-in-use");
  }
  if (mentions("notification", "reminder", "alert", "streak")) permissions.add("notifications");
  if (mentions("microphone", "voice", "record", "podcast")) permissions.add("microphone");

  const accounts = overrides.accounts ?? (def.accounts || mentions("account", "login", "sign in", "profile", "subscription", "sync"));
  const ugc = overrides.ugc ?? (
    overrides.ai === false
      ? mentions("community", "post", "comment", "share", "review", "chat")
      : (def.ugc || mentions("community", "post", "comment", "share", "review", "chat"))
  );
  const ai = overrides.ai ?? (def.aiGeneratedContent || mentions("ai", "gpt", "llm", "generate", "assistant", "chatbot"));

  const stack = { ...def.stack };
  if (overrides.stack) {
    const preset = STACK_PRESETS[overrides.stack];
    if (!preset) throw new Error(`unknown stack "${overrides.stack}". Try: ${Object.keys(STACK_PRESETS).join(", ")}`);
    Object.assign(stack, preset);
  }
  if (overrides.offline) stack.data = stack.data.includes("offline") ? stack.data : `${stack.data}-offline-queue`;

  const monetisation = overrides.monetisation || def.monetisation;
  const payments = overrides.monetisation
    ? (MONETISATION_PAYMENTS[overrides.monetisation] || [overrides.monetisation])
    : def.payments;

  // Screens follow the capability flags, not just the archetype default.
  let screens = [...def.screens];
  if (!payments.length) screens = screens.filter((s) => !/paywall|usage-limits/.test(s));
  if (!accounts) screens = screens.filter((s) => !["auth", "sso-login", "onboarding-kyc"].includes(s));
  if (!ugc) screens = screens.filter((s) => !["comments", "report-block", "moderation-queue"].includes(s));
  if (!ai) screens = screens.filter((s) => s !== "onboarding-disclosure");

  const dataSensitivity = new Set(def.dataSensitivity);
  if (accounts) dataSensitivity.add("account");
  if (permissions.has("location-when-in-use") || permissions.has("location-background")) dataSensitivity.add("location");
  if (ai) dataSensitivity.add("prompts");

  const iosRisks = [...def.ios.reviewRisks];
  const androidRisks = [...def.android.reviewRisks];
  const iosDeclarations = [...def.ios.declarations];
  let iosAgeFloor = def.ios.ageRatingFloor;
  const androidDeclarations = [...def.android.declarations];
  if (accounts) {
    if (!iosDeclarations.includes("account-deletion")) iosDeclarations.push("account-deletion");
    if (!androidDeclarations.includes("account-deletion")) androidDeclarations.push("account-deletion");
    if (!iosRisks.some((risk) => risk.includes("5.1.1"))) iosRisks.push("5.1.1(v) account deletion");
  } else {
    // No accounts means no account-deletion flow. Remove archetype defaults that assume one.
    for (const list of [iosDeclarations, androidDeclarations]) {
      const index = list.indexOf("account-deletion");
      if (index !== -1) list.splice(index, 1);
    }
    for (const list of [iosRisks, androidRisks]) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (/account deletion|account-deletion/i.test(list[i])) list.splice(i, 1);
      }
    }
  }
  if (ugc) {
    iosAgeFloor = def.ios.ageRatingFloor === "4+" ? "13+" : def.ios.ageRatingFloor;
  }
  if (ai) {
    iosDeclarations.push("1.2-ai-output", "5.1.2-third-party-ai");
    androidDeclarations.push("generative-ai-policy");
    iosRisks.push("1.2 unfiltered AI output");
    androidRisks.push("AI content reporting");
  } else {
    for (const list of [iosDeclarations, androidDeclarations]) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (/(^|-)ai(-|$)|generative/i.test(list[i])) list.splice(i, 1);
      }
    }
    for (const list of [iosRisks, androidRisks]) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (/\bai\b|generative|hallucinat/i.test(list[i])) list.splice(i, 1);
      }
    }
  }

  if (ugc) {
    if (!iosDeclarations.includes("ugc-1.2")) iosDeclarations.push("ugc-1.2");
    if (!androidDeclarations.includes("ugc-policy")) androidDeclarations.push("ugc-policy");
    if (!iosRisks.some((risk) => /ugc|filtering|reporting|blocking|moderation/i.test(risk))) {
      iosRisks.push("1.2 missing filtering, reporting or blocking");
    }
    if (!androidRisks.some((risk) => /ugc|moderation|child safety/i.test(risk))) {
      androidRisks.push("UGC moderation required");
    }
  } else {
    for (const list of [iosDeclarations, androidDeclarations]) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (/ugc|child-safety/i.test(list[i])) list.splice(i, 1);
      }
    }
    for (const list of [iosRisks, androidRisks]) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (/ugc|filtering|reporting|blocking|moderation|child safety/i.test(list[i])) list.splice(i, 1);
      }
    }
  }

  const clarify = [];
  if (confidence === "low") {
    clarify.push("Who is the primary user, and what is the one job they open the app to do?");
    clarify.push("Does it need accounts, user content, health data, location, or payments?");
    clarify.push("How does it make money: free, one-time, subscription, ads, or contract?");
  }
  if (ranked[0].score === 0) clarify.unshift("No archetype keywords matched — confirm the closest vertical or pick one with --archetype.");

  const profile = {
    version: 1,
    idea: String(idea).trim(),
    archetype: primary,
    archetypeLabel: def.label,
    secondary,
    confidence,
    clarify,
    coreLoop: def.coreLoop,
    stack,
    screens,
    dataSensitivity: [...dataSensitivity],
    permissions: [...permissions],
    accounts,
    ugc,
    aiGeneratedContent: ai,
    payments,
    monetisation,
    ios: { declarations: [...new Set(iosDeclarations)], ageRatingFloor: iosAgeFloor, reviewRisks: [...new Set(iosRisks)] },
    android: { declarations: [...new Set(androidDeclarations)], contentRatingFloor: def.android.contentRatingFloor, reviewRisks: [...new Set(androidRisks)] },
    motionBudget: def.motionBudget,
    qaFocus: [...def.qaFocus],
    metadataHints: def.metadataHints,
    scores: Object.fromEntries(ranked.filter((entry) => entry.score > 0).map((entry) => [entry.name, entry.score]))
  };

  return profile;
}

function summary(profile) {
  const lines = [
    `Idea:       ${profile.idea}`,
    `Archetype:  ${profile.archetype} (${profile.archetypeLabel})${profile.secondary.length ? ` + ${profile.secondary.join(", ")}` : ""}`,
    `Confidence: ${profile.confidence}`,
    `Stack:      ${profile.stack.primary} / ${profile.stack.ui} / ${profile.stack.state} / ${profile.stack.data}`,
    `Screens:    ${profile.screens.join(" → ")}`,
    `Data:       ${profile.dataSensitivity.join(", ") || "none"}`,
    `Perms:      ${profile.permissions.join(", ") || "none"}`,
    `Money:      ${profile.monetisation}`,
    `Ratings:    ${profile.ios.ageRatingFloor} (iOS) / ${profile.android.contentRatingFloor} (Play)`,
    `Motion:     ${profile.motionBudget}`,
    `Top risks:  ${profile.ios.reviewRisks.slice(0, 3).join("; ")}`,
    `QA:         ${profile.qaFocus.join("; ")}`
  ];
  if (profile.clarify.length) lines.push("", "Clarify:", ...profile.clarify.map((q) => `  - ${q}`));
  return lines.join("\n");
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`error: ${error.message}`);
    console.error(help());
    process.exit(2);
  }
  if (opts.help) { console.log(help()); return; }
  if (!opts.words.length) {
    console.error("error: no idea supplied");
    console.error(help());
    process.exit(2);
  }

  let profile;
  try {
    profile = routeIdea(opts.words.join(" "), opts);
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exit(2);
  }

  const output = opts.json || opts.out || !process.stdout.isTTY ? JSON.stringify(profile, null, 2) : summary(profile);
  if (opts.out) {
    writeFileSync(opts.out, `${JSON.stringify(profile, null, 2)}\n`);
    console.error(`wrote ${opts.out}`);
  }
  console.log(opts.summary && !opts.out && !opts.json ? summary(profile) : output);
}

if (process.argv[1] && process.argv[1].endsWith("route-idea.mjs")) main();

export { ARCHETYPES, ARCHETYPE_ORDER, summary };
