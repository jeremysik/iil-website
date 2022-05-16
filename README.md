# isitlegit.xyz
Sample of my recent work - View site at https://isitlegit.xyz

Apart from getting help on the design of the website, everything was done from scratch by me (development and deployment).

Contact: [@JeremySik](https://twitter.com/JeremySik) (DMs are open)

## Background
isitlegit.xyz is an NFT project rating site.

The home page is a list of NFT projects sorted by "overall rating". This is calculated from the following 5 sub-ratings: Personal, community, originality, communication and consistency. Optional sub-ratings which are empty are ignored.

Anyone with a "genuine" MetaMask wallet is able to connect and rate an NFT project. A wallet is considered genuine if it has at least 0.01 ETH or it has made 10 transactions; this was done to make it more difficult for a single person to post multiple ratings on a single project.

Submitting a rating requires the user to sign a transaction containing a JSON blob of the data, this is verified in the backend to ensure the rating's authenticity.

2000 NFT projects were scraped from the OpenSea's [top collections](https://opensea.io/explore-collections?tab=top) category. This was done late April 2022.

## My Personal Development Philosophy
- Use minimal dependencies
  - Increases long term agility of your code base (i.e. unexpected customisations are easier)
  - Increases stability by reducing chance of bugs from other libraries
  - Reduces breakages when updating libraries
  - *Bonus: Coding your own libararies improves your skill and understanding as a developer*
- Keep hacking to a minimum
  - Reduces tech debt which increases development speed over the long term
- Don't optimise *too* early
  - E.g. Don't abstract a function until you need it in 2-3 places
- Always remove dead code
- Keep it simple
  - Avoid confusing one-liners
  - Be careful with long functional chains, they're inflexible and can be hard to update/maintain
  - Loops are your friend
  - Don't over engineer
- Re-evaluate your architecture when necessary
  - If you're struggling to implement something, chances are your architecture needs updating
  - Updating architecture is time consuming, only do it when you know you need to (i.e. test the product case for your new feature first, hacks/prototyping is acceptable here)
- Readability is king
  - In most cases it is more important than execution speed
  - E.g. Use guard statements instead of nested conditionals
  - *Extra credit: Vertically align your code, especially assignments*
- Log your assumptions (e.g. if you expect a number to be greater than 0)
  - This helps you locate bugs much faster
- Code as one
  - Match the style and architecture of the project
- Be like water
  - None of above is set in stone, use your best judgement given the context of the situation 

## Website Features
![PageSpeed Desktop](/github/pageSpeedDesktop.png "PageSpeed Desktop")
- Optimised for desktop performance (see above, for full report click [here](https://pagespeed.web.dev/report?url=https%3A%2F%2Fisitlegit.xyz%2F&form_factor=desktop))
- Fully responsive design including custom elements for mobile (such as the header)
- Basic search functionality (search by name)
- Infinite scroll for project listings and ratings (written by me)
- Good user feedback on website functions (most warning and error cases are covered, especially wallet related ones)
- Admin panel (add/edit NFT projects, moderate ratings), specific wallets can be given admin privileges
- Uptime monitoring (production only)
- Telegram warning and error alerts (production only)
- Google Analytics

## Tech Stack
### Frontend
- Plain JS, CSS, HTML
- Basic custom templating built on Mustache.js
- Bootstrap
- Ethers.js
- Asset minification (production only)

### Backend
- Express + Node.js
- REST-ish API with structured response ([sample](https://isitlegit.xyz/v1/nft-project/e5a1b28e-7de1-40e7-83ba-1056a13e38f7))
- SQlite 3
- Seperate modes for development and production
- Website uptime monitoring (production only)
- Telegram warning/error alerts (production only)
- Rotating log files (production only)
- HTTPS with automatic certificate renewal (production only)
- Custom JS, HTML, CSS minifier (production only)
- PM2 process manager (production only)
- CloudFlare CDN (production only)

### Tools
- Database seeder for development
- Minifier for production
- OpenSea scraper
- Template asset loader (automatically detects and inserts relevant JS/CSS into HTML where a template is used)
