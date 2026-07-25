# McGriff's Rental Website — Project Rules

## Purpose
This repository is the public customer-facing rental website. It is separate from the employee Rental Manager repository.

## Permanent wording rules
- Use **Request Reservation** or **Reservation Request**.
- Never use wording that implies a request is automatically confirmed.
- State clearly that McGriff's must review and confirm every request.

## Public pricing rules
- Do not display rental rates publicly.
- Use: **Call McGriff's for current rental rate information.**
- Store phone: **641-637-4010**.

## Public availability rules
Customers may see:
- Available
- Limited availability
- Currently unavailable
- Expected availability date, when appropriate

Customers must never see:
- Customer names
- Private rental details
- Internal notes
- Exact private scheduling information

## Architecture
- Employee software repository: `mcgriffs-rental-manager`
- Customer website repository: `mcgriffs-rental-website`
- Both may later use the same Firebase project, but the customer website will only access public-safe collections.

## Version 1 scope
- Professional homepage
- Project categories
- Searchable sample equipment catalog
- Call-for-rates messaging
- Reservation request wording
- Mobile-responsive design

Firebase and the working reservation request form will be connected in later releases.
