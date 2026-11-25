# DMP Global Logistics Inc.

Website and container-shipping platform for DMP Global Logistics: container shipping, vehicle shipping, vehicle sales and auto parts, to Nigeria and other countries.

- **Website** (`/`): quote request (sent to WhatsApp), container finder, services, vehicle sales, FAQ.
- **Tracking** (`/#track`): customers enter a DMP tracking number (e.g. `DMP-482913`) and see the shipment's stage, route and ETA.
- **Staff desk** (`/admin`): password-protected page to create shipments, update their status and ETA, and delete them.

Plain HTML, CSS and JavaScript, with Vercel serverless functions in `/api` and a Postgres database (Neon).

## Deploy on Vercel

1. **Import the repo**: in Vercel, go to Add New → Project, pick this repo, then Deploy. There's no build step and no framework.
2. **Add a database**: in the project, go to Storage → Create Database → Neon (Postgres), and connect it to the project. This adds `DATABASE_URL` for you. The `shipments` table is created automatically the first time the site runs.
3. **Add the staff login**: go to Settings → Environment Variables and add:
   - `ADMIN_PASSWORD`: the password your staff will use at `/admin`
   - `SESSION_SECRET`: any long random text (32+ characters)
4. **Redeploy**: go to Deployments → ⋯ → Redeploy, so the new variables take effect.
5. **Custom domain** (optional): go to Settings → Domains and add your domain, e.g. `dmplogistics.com`.

## Fill in your business details

Open `build/index.tpl.html`, find the `BIZ` line near the bottom, and fill it in:

```js
const BIZ = { wa: "2348012345678", phone: "+234 801 234 5678", email: "info@yourdomain.com", addr: "Your office address" };
```

`wa` is the WhatsApp number in international format, digits only. When it's set, quote requests and the green chat button open WhatsApp. Then rebuild with `python3 build/build.py` and push.

## Editing

`index.html` and `admin.html` are generated. Edit the templates in `build/` and run `python3 build/build.py`.

## Shipment stages

Booked → Loaded at origin → Departed port → On the water → Arrived at port → Ready for pickup
