# EduPlan AI - Final Local Setup Guide

Follow these steps to set up the EduPlan AI project on your local machine using VS Code. This guide ensures all features (Frontend, Backend, Database, and AI) work exactly as they do in the preview.

## 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **VS Code** (Visual Studio Code)

<!-- ## 2. Export the Project
1. In the AI Studio Build interface, click the **Settings** (gear icon) or the **Export** menu.
2. Choose **Download as ZIP**.
3. Extract the ZIP file to a folder on your computer. -->

## 3. Open in VS Code
1. Open VS Code.
2. Go to `File > Open Folder...` and select the extracted project folder.
3. Open a new terminal in VS Code (`Terminal > New Terminal`).

## 4. Install Dependencies
In the terminal, run:
```bash
npm install
```

## 5. Configure Environment Variables
Create a new file named `.env` in the root directory and add the following:

<!-- 1. **Gemini API Key:**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Create an API key and add it:
     ```env
     GEMINI_API_KEY=your_gemini_key_here
     ``` -->

<!-- 2. **YouTube Data API Key:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project.
   - Search for **"YouTube Data API v3"** and click **Enable**.
   - Go to `APIs & Services > Credentials`.
   - Click `+ Create Credentials > API Key`.
   - Add it:
     ```env
     YOUTUBE_API_KEY=your_youtube_key_here
     ``` -->

3. **Environment Settings:**
   ```env
   NODE_ENV=development
   PORT=3000
   ```

## 6. Set Up Firebase (Database & Auth)
You need your own Firebase project to store data locally:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named "EduPlan Local".
3. **Enable Authentication:**
   - Go to `Build > Authentication`.
   - Enable the **Google** sign-in provider.
4. **Enable Firestore Database:**
   - Go to `Build > Firestore Database`.
   - Click `Create database` and start in **Test Mode**.
5. **Get Configuration:**
   - Go to `Project Settings` (gear icon).
   - Under `Your apps`, click the `Web` icon (`</>`) to register a new web app.
   - Copy the `firebaseConfig` object.
6. **Update the App:**
   - Open `src/firebase-applet-config.json` in VS Code.
   - Replace the values with your new Firebase project details.

## 7. Deploy Firestore Rules
1. In the Firebase Console, go to `Firestore Database > Rules`.
2. Open the `firestore.rules` file in your VS Code project.
3. Copy the entire content and paste it into the Firebase Console Rules editor.
4. Click **Publish**.

## 8. Run the Application
In the VS Code terminal, run:
```bash
npm run dev
```
The app will start at `http://localhost:3000`. Open this URL in your browser.

## Troubleshooting
- **Image Upload Errors:** If you get size errors, ensure you are using the latest code which includes automatic image compression.
- **Permission Errors:** Ensure your `firestore.rules` are published in the Firebase Console.
- **YouTube Search:** If videos don't appear, check that your `YOUTUBE_API_KEY` is enabled in the Google Cloud Console.

If you face any other errors, please paste them back in the AI Studio chat for immediate help!
