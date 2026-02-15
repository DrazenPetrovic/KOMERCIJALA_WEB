# Izvještaji Feature - Implementation Guide

## Overview
This document describes the implementation of the Partner Reports (Izvještaji) feature, which allows commercial staff to create and save field reports about partners.

## Database Table Structure

The feature uses the table `komercijala.podaci_o_partneru_teren_novi`:

```sql
CREATE TABLE komercijala.podaci_o_partneru_teren_novi(
  sifra_tabele INT(11) NOT NULL AUTO_INCREMENT,
  sifra_radnika INT(11) DEFAULT NULL,
  sifra_partnera INT(11) DEFAULT NULL,
  datum_razgovora DATE DEFAULT NULL,
  podaci LONGTEXT DEFAULT NULL,
  poslano_emailom TINYINT(4) DEFAULT 0 COMMENT '0- nije poslano   1 poslano',
  PRIMARY KEY (sifra_tabele),
  INDEX index_sifra_partnera USING BTREE (sifra_partnera, datum_razgovora)
)
ENGINE = INNODB
AUTO_INCREMENT = 1
CHARACTER SET utf8
COLLATE utf8_general_ci
ROW_FORMAT = DYNAMIC;
```

## Implementation Details

### Backend Components

1. **Service Layer** (`src/services/izvjestaji.service.js`)
   - `savePartnerReport(sifraRadnika, sifraPartnera, podaci)` - Saves a new report
   - `getPartnerReports(sifraPartnera)` - Retrieves all reports for a partner

2. **Controller Layer** (`src/controllers/izvjestaji.controller.js`)
   - `savePartnerReport(req, res)` - Handles POST requests to save reports
   - `getPartnerReports(req, res)` - Handles GET requests to fetch reports

3. **Routes** (`src/routes/izvjestaji.routes.js`)
   - `POST /api/izvjestaji/save` - Endpoint to save a new report
   - `GET /api/izvjestaji/:sifraPartnera` - Endpoint to fetch partner reports

4. **App Registration** (`src/app.js`)
   - Routes are registered with the Express app

### Frontend Components

1. **IzvlestajList Component** (`src/components/IzvlestajList.tsx`)
   - Two-column layout:
     - Left: List of all partners (from existing partners API)
     - Right: Report form and history
   - Features:
     - Partner selection
     - Text area for entering report data
     - SAVE button to submit reports
     - Report history display
     - Success/error messages

2. **Dashboard Integration** (`src/components/Dashboard.tsx`)
   - Added import for IzvlestajList
   - Integrated component into "Izveštaji" section menu

## Data Flow

1. **User Login**: `sifra_radnika` is obtained from JWT token (stored in `req.user.sifraRadnika`)
2. **Partner Selection**: User clicks on a partner from the left panel, `sifra_partnera` is captured
3. **Report Entry**: User types report data in the text area
4. **Save Action**: 
   - On SAVE button click, data is sent to `POST /api/izvjestaji/save`
   - `datum_razgovora` is automatically set to current date
   - `poslano_emailom` defaults to 0
5. **History Display**: After save, reports are refreshed from `GET /api/izvjestaji/:sifraPartnera`

## API Request/Response Examples

### Save Report Request
```http
POST /api/izvjestaji/save
Content-Type: application/json
Cookie: authToken=<jwt-token>

{
  "sifraPartnera": 123,
  "podaci": "Razgovarao sam sa partnerom o novim proizvodima..."
}
```

### Save Report Response
```json
{
  "success": true,
  "insertId": 456,
  "message": "Izvještaj uspješno sačuvan"
}
```

### Get Reports Request
```http
GET /api/izvjestaji/123
Cookie: authToken=<jwt-token>
```

### Get Reports Response
```json
{
  "success": true,
  "data": [
    {
      "sifra_tabele": 456,
      "sifra_radnika": 1,
      "sifra_partnera": 123,
      "datum_razgovora": "2024-02-15",
      "podaci": "Razgovarao sam sa partnerom...",
      "poslano_emailom": 0
    }
  ],
  "count": 1
}
```

## Testing Instructions

### Manual Testing

1. **Start the Development Server**
   ```bash
   npm run dev:server  # Backend on port 3001
   npm run dev         # Frontend on port 5173
   ```

2. **Login to the Application**
   - Use valid credentials to get a JWT token

3. **Navigate to Izvještaji Section**
   - Click on "Izveštaji" in the dashboard menu

4. **Test Partner Selection**
   - Click on any partner from the left panel
   - Verify partner info appears in the right panel
   - Check if existing reports load (if any)

5. **Test Report Creation**
   - Enter text in the report data field
   - Click SAVE button
   - Verify success message appears
   - Check if the new report appears in history

6. **Test Empty Form Validation**
   - Try to save without entering data
   - Verify error message appears

7. **Test Report History**
   - Select different partners
   - Verify correct history loads for each partner
   - Check date formatting
   - Verify "Poslano" badge appears for sent reports

### Database Verification

After saving a report, verify the data in the database:

```sql
SELECT * FROM komercijala.podaci_o_partneru_teren_novi
WHERE sifra_partnera = <selected_partner_id>
ORDER BY datum_razgovora DESC
LIMIT 5;
```

Expected result:
- `sifra_radnika` matches the logged-in user's ID
- `sifra_partnera` matches the selected partner
- `datum_razgovora` is today's date
- `podaci` contains the entered text
- `poslano_emailom` is 0

## UI Features

- **Color Scheme**: Purple (#785E9E) for primary actions, Green (#8FC74A) for headers
- **Responsive Design**: Works on mobile and desktop
- **Loading States**: Spinners shown during API calls
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Confirmation messages after save
- **Date Formatting**: DD.MM.YYYY format for display

## Security Considerations

- All routes are protected with `verifyToken` middleware
- `sifra_radnika` is extracted from JWT token (not client input)
- SQL injection prevented by parameterized queries
- CSRF protection via HTTP-only cookies

## Future Enhancements

Potential improvements:
1. Add email sending functionality (update `poslano_emailom` flag)
2. Add report editing capability
3. Add report deletion (soft delete)
4. Add file attachments to reports
5. Add report templates
6. Add search/filter in report history
7. Add export to PDF functionality
