# Webextension for adding of Glo tickets from your browser

## How to use

1. Download the `glo_capture-1.0-fx.xpi` file from the releases section.
2. Go to `about:addons` in firefox.
3. Click on the gear icon and select `Install add-on from file`.
4. Select the file we downloaded earlier and allow permissions.

In order to use the addon you will need a PAT token from Gitkraken, follow the steps in the addon to generate and enter this PAT token.

You can then start to capture your issues directly from the browser.

## Supported/tested browsers

- Firefox

## Features

- Allows board and column selection for where to add the ticket.
- Captures an image of the current tab and uploads it as a comment to the ticket.
- Allows setting of ticket title and description.
- User authentication using PAT.

## Future roadmap

- OAUTH authentication.
- Chrome support.
- Allow users to set their own description template for faster cretation of tickets.
- Allow the image upload to be removed on a per ticket basis.
- Better styling.
- User assignment
- Due date assignment
- Options screen to change token