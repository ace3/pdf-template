package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	req, err := http.NewRequest("GET", "/health", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(healthHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	expected := `{"status":"OK"`
	if !bytes.Contains(rr.Body.Bytes(), []byte(expected)) {
		t.Errorf("handler returned unexpected body: got %v want to contain %v",
			rr.Body.String(), expected)
	}
}

func TestPembelianHandlerInvalidJSON(t *testing.T) {
	req, err := http.NewRequest("POST", "/pembelian", bytes.NewBuffer([]byte("invalid json")))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(pembelianHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusBadRequest)
	}
}

func TestFillPembelianTemplate(t *testing.T) {
	// Initialize template for testing
	pembelianHTMLTemplate = "Hello {{leftAddress.name}} from {{rightAddress.manager}}"

	payload := PembelianPayload{
		LeftAddress: Address{
			Name: "Test Company",
		},
		RightAddress: RightAddress{
			Manager: "Test Manager",
		},
	}

	result := fillPembelianTemplate(payload)
	expected := "Hello Test Company from Test Manager"

	if result != expected {
		t.Errorf("Template filling failed: got %v want %v", result, expected)
	}
}
