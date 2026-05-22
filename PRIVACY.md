# Privacy Policy

**Last updated: May 2026**

## Summary

Atlas collects no data. Everything you create stays on your device.

---

## Data storage

All trip data — locations, spots, photos, notes, audio, links, routes, and canvas layouts — is stored exclusively in your browser's **IndexedDB** database using [Dexie.js](https://dexie.org). This database lives on your local machine and is never transmitted anywhere.

Atlas has no backend, no server, no database, and no cloud sync. There is no account system.

## Network requests

Atlas makes **zero network requests** during normal use. The only outbound connection the app ever makes is if you manually paste an external URL into a link memory — that URL is stored as text and only opened if you click it.

## Analytics and tracking

None. No analytics, no telemetry, no error reporting, no third-party scripts.

## Cookies

None.

## Photos and media

Photos and other files you upload are converted to binary blobs and stored in IndexedDB on your device. They are never uploaded to any server.

When you use the **Export to HTML** feature, media files are embedded as base64 data URIs directly inside the generated HTML file. That file is written to your local disk — you control where it goes and who sees it.

When you use the **Save Backup** feature, a `.atlas` file is written to your local disk. This file contains all your trip data including embedded media. Keep it in a safe place; it is your only backup.

## Children

Atlas does not knowingly collect any data from anyone, including children, because it does not collect data at all.

## Changes

If this policy changes, the updated version will be committed to the repository with a new date at the top of this file.

## Contact

Open an issue on the GitHub repository if you have questions.
