# CareMind

CareMind is an Expo-based React Native app scaffold focused on mental wellness tracking. The starter template ships with TypeScript, React Navigation (stack plus bottom tabs), and a clean folder structure for future features across patient, clinician, and family roles.

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer (bundled with Node.js)
- Expo Go installed on your iOS or Android device
- Optional: Expo CLI account for cloud builds

## Initial Setup

```bash
# Install dependencies (already run during scaffolding but safe to repeat)
cd CareMind
npm install
```

## Running the App with Expo Go

```bash
# Start the development server
npm run start
```

1. Open the Expo Go app on your device.
2. Scan the QR code shown in the terminal or browser window.
3. Wait for the JavaScript bundle to load; the CareMind Home screen should appear.

## Project Structure

```
CareMind
├── App.tsx
├── app.config.ts
├── screens/
│   ├── DoctorDashboardScreen.tsx
│   ├── FamilyViewScreen.tsx
│   ├── HomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── NurseTasksScreen.tsx
│   ├── PatientSummaryScreen.tsx
│   └── PharmacistReviewScreen.tsx
├── components/
├── services/
├── assets/
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

## Available Scripts

```bash
npm run start   # Launch Expo dev server (default platform prompt)
npm run android # Build and open Android emulator if available
npm run ios     # Requires macOS with Xcode or Expo Go for device testing
npm run web     # Run in web browser via Expo for Web
```

## Next Steps

- Connect each role tab to domain-specific data sources and workflows.
- Add authenticated flows by extending the root stack navigator.
- Introduce reusable UI elements under components/.

## Environment Variables

1. Copy `.env.example` to `.env` and add your key:

	```bash
	cp .env.example .env
	echo "EXPO_PUBLIC_GEMINI_API_KEY=your-key" >> .env
	```

2. The Expo config in `app.config.ts` loads `.env` via `dotenv` before bundling so the value is injected as
	`process.env.EXPO_PUBLIC_GEMINI_API_KEY` inside the app. Avoid committing `.env`; the file is ignored by `.gitignore`.

3. To switch keys for production, supply the variable at build time (e.g., `EXPO_PUBLIC_GEMINI_API_KEY=... npx expo start`).
