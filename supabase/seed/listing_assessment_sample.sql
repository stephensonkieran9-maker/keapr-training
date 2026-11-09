-- SAMPLE listing-build assessment (run after migration 0018).
-- Generated from lib/assessment/sample.ts. Fictional property: have someone
-- check the answer key before sending the link to real candidates.
-- Starts CLOSED. Open it from Admin → Assessments when you're ready.
-- Safe to re-run: it skips if an assessment with this title already exists.

insert into public.assessments (title, slug, intro, case_study, config, time_limit_minutes, is_open, is_demo)
select $t$Listing build: The Hollies House$t$,
       'listing-' || substr(md5(gen_random_uuid()::text), 1, 12),
       $intro$This is a timed listing-build exercise.

When you press **Start**, the timer begins and you'll see a property brief on the left and a listing builder on the right, like the one used on Airbnb or Booking.com. Read the brief carefully and build the listing from it.

- You have one attempt. The timer keeps running if you close the page.
- Your answers save automatically as you go.
- When the time is up, whatever you've entered is submitted automatically.
- You're marked on accuracy first, then on how quickly you finish. Accuracy matters more than speed.
- Use only the brief. Don't guess or add anything it doesn't say.$intro$,
       $cs$# The Hollies House

18 The Hollies, Brampton Rd, Newcastle-under-Lyme, Newcastle ST5 0QT, UK

## Before you start

Build the listing using only the information in this brief.

- **Amenities:** tick only what the brief lists.
- **Discounts:** if the brief doesn't give a discount, enter 0.
- **Photos:** download the property photos from the Photos step, upload all of them, and put them in this order: **living spaces, dining, kitchen, bedrooms, bathrooms, then anything else**.
- **Title, description and neighbourhood:** write your own, within the character limits.

---

## 1. Property overview

The Hollies House is a three-bedroom house in Newcastle-under-Lyme, suitable for contractors, business travellers, families, relocation guests and professionals seeking short- or long-term accommodation.

| Property detail | Information |
| --- | --- |
| Property name | The Hollies House |
| Full address | 18 The Hollies, Brampton Rd, Newcastle-under-Lyme, Newcastle ST5 0QT, UK |
| Property type | 3-bedroom house (guests have the whole house) |
| Bedrooms | 3 |
| Bathrooms | 2 |
| Maximum occupancy | 6 guests |
| Parking | Free street parking for 1 vehicle |
| Outdoor space | Private garden |
| Internet | Free Wi-Fi |

## 2. Target guests

- Contractors working on projects in Newcastle-under-Lyme and surrounding areas.
- Business travellers requiring comfortable and practical accommodation.
- Families visiting relatives or exploring Staffordshire.
- Relocation guests and professionals requiring temporary accommodation.
- Long-stay guests looking for a fully equipped home.

## 3. Sleeping arrangements

| Bedroom | Sleeping arrangement |
| --- | --- |
| Bedroom 1 | 1 King Bed |
| Bedroom 2 | 1 Double Bed |
| Bedroom 3 | 2 Single Beds |

## 4. Amenities and facilities

**Kitchen and dining:** Fully equipped kitchen • Refrigerator • Microwave • Oven • Dining area

**Living and entertainment:** Television • Free Wi-Fi • Heating

**Laundry and other facilities:** Washing machine • Iron and ironing board • Hairdryer

**Outdoor facilities:** Private garden

**Parking information:** Free street parking is available for one vehicle. The property does not have private or designated parking.

## 5. Check-in and check-out

| Information | Details |
| --- | --- |
| Check-in | 3:00 PM |
| Check-out | 10:00 AM |
| Check-in method | Self check-in |
| Access instructions | Shared with guests before arrival |

Guests will receive the necessary access instructions before their scheduled arrival.

## 6. House rules and policies

| Policy | Details |
| --- | --- |
| Smoking | Smoking is strictly prohibited inside the property. |
| Parties and events | Parties, gatherings and events are not permitted. |
| Pets | Pets are allowed upon request. Additional charges apply. |
| Security deposit | £300 security deposit is required. |
| Minimum stay | 28 nights |
| Cancellation policy | Strict (14 days) |

## 7. Pricing and additional charges

| Pricing component | Amount / terms |
| --- | --- |
| Standard nightly rate | £125 per night |
| Cleaning fee | £60 per stay |
| Long-stay discount | 10% discount on the nightly rate for stays of 90 nights or more |
| Pet fee | £200 per stay |
| Security deposit | £300 |

**Example contractor quote:** show the total for a contractor staying **28 nights**, with any discount that applies and the cleaning fee added once. Don't include the refundable security deposit.

## 8. Location highlights

**Nearby attractions**

| Attraction | Approx. distance | Description |
| --- | --- | --- |
| Brampton Park & Museum | 0.5 miles | Beautiful gardens, walking paths, a children's play area and local history exhibitions. |
| New Vic Theatre | 1.5 miles | A popular local theatre featuring live performances, musicals and cultural entertainment. |
| Apedale Heritage Centre | 2.5 miles | Explore the area's mining heritage, museum exhibits and historic underground mine tours. |

**Getting around**

| Location | Approx. distance | Description |
| --- | --- | --- |
| Newcastle-under-Lyme Town Centre | 0.7 miles | Shops, restaurants, cafés and everyday amenities. |
| Newcastle-under-Lyme Bus Station | 0.9 miles | Regular bus connections to Stoke-on-Trent, Hanley and surrounding areas. |
| Longport Railway Station | 1.9 miles | Rail connections to Stoke-on-Trent, Crewe and other destinations. |$cs$,
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
      "weight": 2,
      "mustMention": [
        "3 bed|three bed|3 bedroom|three bedroom|3bed|3 bedrooms|three bedrooms",
        "newcastle"
      ]
    },
    "description": {
      "weight": 3,
      "mustMention": [
        "3 bed|three bed|3 bedroom|three bedroom|3bed|3 bedrooms|three bedrooms",
        "sleeps 6|6 guests|six guests|up to 6|sleeps six|up to six",
        "2 bathrooms|two bathrooms|2 bath|two bath",
        "newcastle",
        "wifi|wi fi",
        "garden",
        "parking",
        "contractor|contractors"
      ]
    },
    "neighbourhood": {
      "weight": 2,
      "mustMention": [
        "brampton park",
        "new vic|theatre",
        "apedale",
        "town centre",
        "bus station|bus",
        "longport|railway|train"
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
        "washing_machine",
        "iron",
        "hair_dryer",
        "private_garden",
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
      "tolerance": 1
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
       60, false, false
where not exists (select 1 from public.assessments where title = $t$Listing build: The Hollies House$t$);
