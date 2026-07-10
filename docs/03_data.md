# Data Model

## Group

id

name

created_at

---

## User

id

nickname

group_id

created_at

---

## Post

id

group_id

user_id

masked_text

original_length

rewrite_count

delete_count

typing_duration

silent_duration

started_at

sent_at

created_at

---

## Reactions

id

post_id

user_id

emoji

created_at

---

## Notes

Original text is not displayed.

The application mainly presents traces generated during writing.

The original message may be stored or discarded depending on future design decisions.
