import httpx

url = "http://127.0.0.1:8000/pdf/preview-invoice"
payload = {
  "businessId": 1,
  "invoiceNumber": "INVC-0001",
  "BookNo": "1",
  "invoiceDate": "2026-04-21",
  "CustomerName": "John Doe",
  "amountinwords": "One Hundred Only",
  "invoiceAmount": 100,
  "purpose": "Testing",
  "billCollector": "Collector",
  "Nazim": "Manager",
  "customerFullAddress": "123 Street",
  "customerPhone": "123456789",
  "paymentMode": "Cash",
  "paymentType": "Full"
}

try:
    response = httpx.post(url, json=payload, timeout=10)
    print("STATUS:", response.status_code)
    if response.status_code != 200:
        print("ERROR:", response.text)
    else:
        print("SUCCESS! PDF received.")
except Exception as e:
    print("Request failed:", e)
