This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# CouchDB Local Setup & React Native App Configuration

## 1. Install CouchDB Locally

- Download and install CouchDB from: [https://couchdb.apache.org/#download](https://couchdb.apache.org/#download)
- Start CouchDB. By default, it runs at:
  - `http://127.0.0.1:5984/`
  - The admin dashboard is at: `http://127.0.0.1:5984/_utils`

## 2. Set Up CouchDB Admin User

- On first launch, set up an admin username and password in the Fauxton dashboard.
- Remember these credentials; you’ll need them in your app config.

## 3. Configure Your React Native App

### A. For Android Emulator

- The Android emulator cannot access `localhost` directly.
- Use the special IP `10.0.2.2` to access your computer’s localhost.

**Example config (`src/utils/couchdbConfig.js`):**

```js
export const getCouchDBUrl = () => {
  return 'http://10.0.2.2:5984';
};

export const COUCHDB_CONFIG = {
  url: getCouchDBUrl(),
  database: 'offlinefirstdb', // or your chosen DB name
  username: 'YOUR_ADMIN_USERNAME',
  password: 'YOUR_ADMIN_PASSWORD',
};
```

### B. For Physical Device (Same Wi-Fi Network as Computer)

1. **Find your computer’s local IP address:**
   - On Windows: Open Command Prompt and run `ipconfig`. Look for `IPv4 Address` (e.g., `192.168.1.100`).
   - On Mac/Linux: Run `ifconfig` or check your network settings.
2. **Update your app config:**

```js
export const getCouchDBUrl = () => {
  return 'http://192.168.1.100:5984'; // Replace with your actual IP
};

export const COUCHDB_CONFIG = {
  url: getCouchDBUrl(),
  database: 'offlinefirstdb',
  username: 'YOUR_ADMIN_USERNAME',
  password: 'YOUR_ADMIN_PASSWORD',
};
```

3. **Make sure your firewall allows incoming connections on port 5984.**

### C. For iOS Simulator

- The iOS simulator can use `localhost` directly:

```js
export const getCouchDBUrl = () => {
  return 'http://localhost:5984';
};
```

## 4. Run the App

- Start CouchDB on your computer.
- Run your React Native app on the emulator or physical device.
- The app will connect to CouchDB using the config above.

## 5. Troubleshooting

- **If the app cannot connect:**
  - Double-check the IP address and port.
  - Ensure both devices are on the same Wi-Fi network.
  - Temporarily disable your firewall to test (re-enable after).
  - Try accessing `http://<your-ip>:5984/_utils` from your phone’s browser.

## 6. Switching Between Emulator and Device

- Change the `getCouchDBUrl` function as needed for your test environment.

## 7. Example: Full Config File

```js
// src/utils/couchdbConfig.js
import { Platform } from 'react-native';

export const getCouchDBUrl = () => {
  if (Platform.OS === 'android') {
    // Android emulator
    return 'http://10.0.2.2:5984';
  } else if (Platform.OS === 'ios') {
    // iOS simulator
    return 'http://localhost:5984';
  } else {
    // For physical device, set your computer's IP
    return 'http://192.168.1.100:5984'; // Replace with your IP
  }
};

export const COUCHDB_CONFIG = {
  url: getCouchDBUrl(),
  database: 'offlinefirstdb',
  username: 'YOUR_ADMIN_USERNAME',
  password: 'YOUR_ADMIN_PASSWORD',
};
```

## 8. Summary Table

| Environment      | CouchDB URL Example   |
| ---------------- | --------------------- |
| Android Emulator | http://10.0.2.2:5984  |
| iOS Simulator    | http://localhost:5984 |
| Physical Device  | http://<your-ip>:5984 |

**Replace `YOUR_ADMIN_USERNAME` and `YOUR_ADMIN_PASSWORD` with your actual CouchDB credentials.**
