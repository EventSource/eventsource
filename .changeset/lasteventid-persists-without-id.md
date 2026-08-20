---
'eventsource': patch
---

Fixed `lastEventId` being blanked by an event that omits the `id` field

The `lastEventId` attribute is the last event ID string of the event source, so an explicit `id` field persists until another one replaces it. Message events were dispatched with the current event's own `id` instead of that buffer, which left `lastEventId` empty on every event that omitted `id`, even though the buffer still held the earlier value and would have been sent as `Last-Event-ID` on reconnect.
