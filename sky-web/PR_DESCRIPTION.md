# Sky Web Delivery PR

## Title

```text
feat: deliver sky-web dual-entry frontend and end-to-end acceptance flow
```

## Summary

- deliver the new `sky-web` React frontend with dual entrypoints for customer and console
- align frontend flows with existing backend APIs without changing database schema or auth protocol
- add end-to-end acceptance coverage for customer ordering and console fulfillment

## Main Changes

- add `sky-web` dual-entry app:
  - `/customer/*` for customer ordering
  - `/console/*` for admin and merchant operations
- connect customer flow to real backend APIs:
  - mock login
  - category, dish, setmeal browsing
  - shopping cart
  - address book
  - submit order
  - payment, reminder, cancel, repetition
- connect console flow to real backend APIs:
  - workspace
  - orders
  - categories
  - dishes
  - setmeals
  - shop status
  - reports
  - employees
- keep console role separation on the frontend:
  - merchant view
  - admin view
- add explicit success and error feedback across console CRUD and status actions
- keep chart runtime split into on-demand chunks instead of a single large ECharts bundle
- add delivery docs and end-to-end acceptance artifacts

## Verification

### Backend

```powershell
./mvnw -q -pl sky-server -am test
./mvnw -q -pl sky-server -am -DskipTests compile
```

### Frontend

```powershell
cd .\sky-web
npm run lint
npm run build
```

### Runtime checks

- `http://127.0.0.1:8080/doc.html`
- `http://127.0.0.1/customer/`
- `http://127.0.0.1/console/`

### End-to-end acceptance

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sky_web_end_to_end_acceptance.ps1
```

Expected result:

- `customerEntryOk = true`
- `consoleEntryOk = true`
- `docEntryOk = true`
- `finalStatus = 5`
- `finalPayStatus = 1`

## Notes

- backend APIs and auth headers remain unchanged
- customer side still uses the current mock login strategy
- demo fallback is kept only for selected dashboard/report scenarios and is explicitly labeled in the UI
