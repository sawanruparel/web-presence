---
title: "Sample Protected Idea"
date: "2025-01-15"
readTime: "3 min"
type: "idea"
protected: true
---

# Sample Protected Idea

This is a sample protected idea that demonstrates the password protection feature.

## What This Tests

This protected content will help you test:

1. **Password verification flow** - Users need to enter a password to access this content
2. **Session management** - Once verified, users stay logged in for the session
3. **Content fetching** - The full content is fetched from the backend API
4. **UI indicators** - Protected content shows a lock icon and "Protected" badge

## Technical Details

- This content is stored in `content-protected/ideas/`
- It has `protected: true` in the frontmatter
- The build process will generate it in `protected-content.json` for the backend
- The frontend will show it in the ideas list with a lock icon
- Clicking it will prompt for a password

## Backend Requirements

For this to work, you'll need to implement the backend API as described in `docs/api-contract.md`:

1. **Password verification endpoint** - `POST /api/verify-password`
2. **Content retrieval endpoint** - `GET /api/protected-content/:type/:slug`
3. **Password storage** - Store hashed passwords for each protected content item

## Testing Steps

1. Add this file to your `content-protected/ideas/` folder
2. Run the build process to generate `protected-content.json`
3. Set up your backend API with the password "test123" for this content
4. Start your frontend and navigate to the Ideas page
5. You should see this idea with a lock icon
6. Click it and enter the password to access the content

## Security Notes

- Passwords should be hashed with bcrypt on the backend
- Tokens should have reasonable expiration times
- Rate limiting should be implemented for password attempts
- All API communication should be over HTTPS in production

This is just a sample - replace with your actual protected content!
