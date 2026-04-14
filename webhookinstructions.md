# SRCC Admin Assist: Webhook Integration Guide

This guide explains how external applications (Student App and Teacher App) should integrate with the SRCC Admin Assist portal to receive real-time updates when a faculty member is marked absent.

## 1. Connection Endpoint

Your application must expose a public HTTP POST endpoint. For example:
`https://your-app.com/api/webhook/absence`

## 2. Authentication

To prevent unauthorized requests, the Admin portal sends a Bearer token in the headers. Your endpoint **MUST** verify this token.

- **Header**: `Authorization`
- **Format**: `Bearer <YOUR_SHARED_SECRET>`

> [!IMPORTANT]
> Ensure the `<YOUR_SHARED_SECRET>` value in your app matches the `WEBHOOK_SECRET` environment variable set in the SRCC Admin Assist Cloudflare dashboard.

## 3. Webhook Payload

The Admin portal sends a JSON payload for **each individual day** within an absence range.

### Example Payload
```json
{
  "teacherId": "T055",
  "teacherName": "Prof. Harsh",
  "date": "2026-04-14",
  "from": "2026-04-14",
  "to": "2026-04-16",
  "adminUser": "keshav_admin"
}
```

### Field Definitions
| Field | Type | Description |
| :--- | :--- | :--- |
| `teacherId` | `string` | The unique institutional ID of the faculty member. |
| `teacherName` | `string` | The full name of the faculty member. |
| `date` | `string` | The specific date (YYYY-MM-DD) for which this notification is triggered. |
| `from` | `string` | The commencement date of the full absence period. |
| `to` | `string` | The expected termination date of the full absence period. |
| `adminUser` | `string` | The username of the administrator who recorded the absence. |

## 4. Expected Response

Your endpoint should return a `200 OK` or `202 Accepted` status code upon successful receipt. 

- **Success**: Status `200`
- **Authentication Failure**: Status `401 Unauthorized`
- **Data Error**: Status `400 Bad Request`

## 5. Implementation Recommendations

1. **Atomic Updates**: When receiving a notification, ensure your internal timetable or notification system is updated atomically to avoid duplicates.
2. **Logging**: Log the `adminUser` and `date` for auditing purposes within your app.
3. **Idempotency**: Since the Admin portal might retry a request in case of a timeout, ensure your system can handle the same payload multiple times without side effects.
