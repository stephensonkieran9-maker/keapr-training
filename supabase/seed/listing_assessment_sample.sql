-- SAMPLE listing-build assessment (run after migration 0018).
-- Generated from lib/assessment/sample.ts. Fictional property: have someone
-- check the answer key before sending the link to real candidates.
-- Starts CLOSED. Open it from Admin → Assessments when you're ready.
-- Safe to re-run: it skips if an assessment with this title already exists.

insert into public.assessments (title, slug, intro, case_study, config, time_limit_minutes, is_open, is_demo)
select $t$Listing build: The Hollies House$t$,
       'listing-' || substr(md5(gen_random_uuid()::text), 1, 12),
       $intro$This is a listing-build exercise.

When you press **Start**, you'll see a property brief on the left and a listing builder on the right, like the one used on Airbnb or Booking.com. Read the brief carefully and build the listing from it.

- You have one attempt.
- Your answers save automatically as you go, so you can come back if you close the page.
- Check your work before you submit. You can't change anything afterwards.
- Use only the brief. Don't guess or add anything it doesn't say.$intro$,
       $cs$# The Hollies House

18 The Hollies, Brampton Rd, Newcastle-under-Lyme, Newcastle ST5 0QT, UK

## Before you start

Build the listing using only the information in this brief.

- **Title:** write a title that tells guests what the property is, how big it is, its key features and where it is.
- **Description:** write the listing description in your own words, as full sentences that would make a guest want to book. Don't just copy the bullet points from this brief.
- **Getting around:** the *Getting around* section at the end goes in the neighbourhood and getting around box, not the description.
- **Amenities:** tick only what the brief lists.
- **Discounts:** if the brief doesn't give a discount, enter 0.
- **Example contractor quote:** work out the total for one contractor (**no pets**) staying **28 nights**: the nightly rate for every night, minus any discount that applies, plus the cleaning fee once. Don't include the refundable security deposit.

---

## Property summary

- **Property name:** The Hollies House
- **Address:** 18 The Hollies, Brampton Rd, Newcastle-under-Lyme, Newcastle ST5 0QT, UK
- **Property type:** House. Guests have the whole house.
- **Bedrooms:** 3
- **Bathrooms:** 2
- **Maximum occupancy:** 6 guests
- **Outdoor space:** Private garden
- **Internet:** Free Wi-Fi
- **Nightly rate:** £125
- **Cleaning fee:** £60 per stay
- **Security deposit:** £300
- **Pet fee:** £200 per stay
- **Long-stay discount:** 10% off the nightly rate for stays of 90 nights or more
- **Minimum stay:** 28 nights
- **Cancellation policy:** Strict (14 days)
- **Pets:** Pets are allowed upon request. Additional charges apply.
- **Parking:** Free street parking for 1 vehicle. There is no private or designated parking.

## Suitable for

The Hollies House is suitable for both short and long stays, including long-term guests. It's aimed at:

- **Contractors** working on projects in Newcastle-under-Lyme and surrounding areas
- **Business travellers** who need comfortable, practical accommodation
- **Families** visiting relatives or exploring Staffordshire
- **Relocation guests and professionals** who need temporary accommodation
- **Long-stay guests** looking for a fully equipped home

## Sleeping arrangements

- **Bedroom 1:** 1 King Bed
- **Bedroom 2:** 1 Double Bed
- **Bedroom 3:** 2 Single Beds

## Amenities and facilities

- **Kitchen and dining:** Fully equipped kitchen • Refrigerator • Microwave • Oven • Dining area
- **Living and entertainment:** Television • Free Wi-Fi • Heating • Hot water
- **Laundry and other facilities:** Washing machine • Iron and ironing board • Hairdryer
- **Safety:** Smoke alarm • Carbon monoxide alarm
- **Outdoor:** Private garden

## Check-in and access

- **Check-in:** From 3:00 PM
- **Check-out:** By 10:00 AM
- **Check-in method:** Self check-in
- **Access instructions:** Shared with guests before their scheduled arrival

## House rules

- **Security deposit:** A £300 security deposit is required.
- **Smoking:** Smoking is strictly prohibited inside the property.
- **Pets:** Pets are allowed upon request. A pet fee of £200 per stay applies.
- **Parties and events:** Parties, gatherings and events are not permitted.

## Nearby attractions

- **Brampton Park & Museum:** about 0.5 miles. Gardens, walking paths, a children's play area and local history exhibitions.
- **New Vic Theatre:** about 1.5 miles. Live performances, musicals and cultural entertainment.
- **Apedale Heritage Centre:** about 2.5 miles. The area's mining heritage, museum exhibits and underground mine tours.

## Photo order

Download the photos from the **Photos** step, upload **all** of them, and put them in this order:

1. Living spaces
2. Dining
3. Kitchen
4. Bedrooms
5. Bathrooms
6. Anything else (outside of the house, garden)

## Getting around

- **Newcastle-under-Lyme Town Centre:** about 0.7 miles. Shops, restaurants, cafés and everyday amenities.
- **Newcastle-under-Lyme Bus Station:** about 0.9 miles. Regular buses to Stoke-on-Trent, Hanley and surrounding areas.
- **Longport Railway Station:** about 1.9 miles. Trains to Stoke-on-Trent, Crewe and other destinations.$cs$,
       $cfg${
  "fields": {
    "propertyType": {
      "weight": 1,
      "answer": "house"
    },
    "placeType": {
      "weight": 1,
      "answer": "entire"
    },
    "street": {
      "weight": 1,
      "answer": "18 The Hollies|18 The Hollies, Brampton Rd|18 The Hollies, Brampton Road"
    },
    "city": {
      "weight": 1,
      "answer": "Newcastle-under-Lyme|Newcastle under Lyme|Newcastle"
    },
    "postcode": {
      "weight": 1,
      "answer": "ST5 0QT"
    },
    "targetGuests": {
      "weight": 1,
      "answer": [
        "contractors_and_work_crews",
        "relocations",
        "business_travellers",
        "families",
        "long_stay_guests"
      ]
    },
    "title": {
      "weight": 5,
      "mustMention": [
        "3 bed|three bed|3 bedroom|three bedroom|3bed|3 bedrooms|three bedrooms|3 br",
        "house|home",
        "garden",
        "wifi|wi fi",
        "newcastle"
      ]
    },
    "description": {
      "weight": 9,
      "qualityWeight": 3,
      "mustMention": [
        "3 bed|three bed|3 bedroom|three bedroom|3bed|3 bedrooms|three bedrooms",
        "sleeps 6|sleeps six|6 guests|six guests|up to 6|up to six|accommodates 6|accommodates six|6 people|six people",
        "2 bathrooms|two bathrooms|2 bath|two bath",
        "newcastle",
        "contractor|contractors|business traveller|business travellers|families|family|relocation|relocating|professionals",
        "long stay|long stays|long term|longer stays|extended stay|extended stays|short or long|short and long",
        "kitchen",
        "wifi|wi fi|internet|broadband",
        "garden",
        "parking|park",
        "self check in|self checkin|self check|check yourself in|keyless",
        "brampton park|new vic|apedale",
        "smoking|smoke free|parties|party|events|pets|pet"
      ]
    },
    "neighbourhood": {
      "weight": 2,
      "mustMention": [
        "town centre",
        "bus station|bus",
        "longport|railway|train|rail"
      ]
    },
    "photos": {
      "weight": 3
    },
    "maxGuests": {
      "weight": 1,
      "answer": 6
    },
    "bedrooms": {
      "weight": 1,
      "answer": 3
    },
    "beds": {
      "weight": 1,
      "answer": 4
    },
    "bathrooms": {
      "weight": 1,
      "answer": 2
    },
    "rooms": {
      "weight": 2,
      "answer": {
        "bedrooms": [
          {
            "king": 1
          },
          {
            "double": 1
          },
          {
            "single": 2
          }
        ],
        "common": {}
      }
    },
    "amenities": {
      "weight": 4,
      "answer": [
        "kitchen",
        "fridge",
        "microwave",
        "oven",
        "dining_table",
        "tv",
        "wi_fi",
        "central_heating",
        "hot_water",
        "washing_machine",
        "iron",
        "hair_dryer",
        "private_garden",
        "smoke_alarm",
        "carbon_monoxide_alarm",
        "long_term_stays_allowed"
      ]
    },
    "parking": {
      "weight": 1,
      "answer": "free_on_street_parking"
    },
    "parkingSpaces": {
      "weight": 1,
      "answer": 1
    },
    "baseRate": {
      "weight": 1,
      "answer": 125
    },
    "cleaningFee": {
      "weight": 1,
      "answer": 60
    },
    "petFee": {
      "weight": 1,
      "answer": 200
    },
    "securityDeposit": {
      "weight": 1,
      "answer": 300
    },
    "weeklyDiscount": {
      "weight": 1,
      "answer": 0
    },
    "monthlyDiscount": {
      "weight": 1,
      "answer": 0
    },
    "longStayDiscount": {
      "weight": 1,
      "answer": 10
    },
    "contractorQuote": {
      "weight": 2,
      "answer": 3560,
      "tolerance": 1,
      "explanation": "28 nights × £125 = £3,500, plus the £60 cleaning fee = £3,560. No discount (it's under 90 nights), no pet fee (no pets) and no deposit (it's refundable)."
    },
    "minNights": {
      "weight": 1,
      "answer": 28
    },
    "checkInFrom": {
      "weight": 1,
      "answer": "15:00"
    },
    "checkOut": {
      "weight": 1,
      "answer": "10:00"
    },
    "cancellation": {
      "weight": 1,
      "answer": "strict"
    },
    "petsAllowed": {
      "weight": 1,
      "answer": "yes"
    },
    "smokingAllowed": {
      "weight": 1,
      "answer": "no"
    },
    "eventsAllowed": {
      "weight": 1,
      "answer": "no"
    },
    "additionalRules": {
      "weight": 1,
      "mustMention": [
        "deposit",
        "pet|pets"
      ]
    }
  }
}$cfg$::jsonb,
       120, false, false
where not exists (select 1 from public.assessments where title = $t$Listing build: The Hollies House$t$);
