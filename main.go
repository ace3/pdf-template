package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	"github.com/gorilla/mux"
)

// Address represents address information
type Address struct {
	Name    string `json:"name"`
	Street  string `json:"street"`
	Area    string `json:"area"`
	City    string `json:"city"`
	Country string `json:"country"`
}

// RightAddress represents right side address information
type RightAddress struct {
	Manager         string `json:"manager"`
	Email           string `json:"email"`
	TransactionDate string `json:"transactionDate"`
	PeriodStart     string `json:"periodStart"`
	PeriodEnd       string `json:"periodEnd"`
}

// Transaction represents transaction information
type Transaction struct {
	Type                   string `json:"type"`
	Number                 string `json:"number"`
	Amount                 string `json:"amount"`
	Fee                    string `json:"fee"`
	PPNPercent             string `json:"ppnPercent"`
	PPNAmount              string `json:"ppnAmount"`
	Product                string `json:"product"`
	SubscriptionFeePercent string `json:"subscriptionFeePercent"`
	SubscriptionFeeAmount  string `json:"subscriptionFeeAmount"`
	NetAmount              string `json:"netAmount"`
	Unit                   string `json:"unit"`
	NAVPerUnit             string `json:"navPerUnit"`
	PPHPercent             string `json:"pphPercent"`
	PPHAmount              string `json:"pphAmount"`
	RedemptionFeePercent   string `json:"redemptionFeePercent"`
	RedemptionFeeAmount    string `json:"redemptionFeeAmount"`
}

// Bank represents bank information
type Bank struct {
	Name            string `json:"name"`
	Account         string `json:"account"`
	AccountName     string `json:"accountName"`
	VerifiedAmount  string `json:"verifiedAmount"`
	PaymentDateTime string `json:"paymentDateTime"`
	Reference       string `json:"reference"`
}

// BulananTransaction represents monthly report transaction
type BulananTransaction struct {
	Date        string `json:"date"`
	Description string `json:"description"`
	Number      string `json:"number"`
	NAVPerUnit  string `json:"navPerUnit"`
	Unit        string `json:"unit"`
	MarketValue string `json:"marketValue"`
	NoActivity  bool   `json:"noActivity"`
}

// PembelianPayload represents the payload for pembelian endpoint
type PembelianPayload struct {
	LeftAddress  Address      `json:"leftAddress"`
	RightAddress RightAddress `json:"rightAddress"`
	Transaction  Transaction  `json:"transaction"`
}

// PenjualanPayload represents the payload for penjualan endpoint
type PenjualanPayload struct {
	LeftAddress  Address      `json:"leftAddress"`
	RightAddress RightAddress `json:"rightAddress"`
	Transaction  Transaction  `json:"transaction"`
	Bank         Bank         `json:"bank"`
}

// BulananPayload represents the payload for bulanan endpoint
type BulananPayload struct {
	LeftAddress  Address              `json:"leftAddress"`
	RightAddress RightAddress         `json:"rightAddress"`
	Product      string               `json:"product"`
	Transactions []BulananTransaction `json:"transactions"`
}

// Global templates
var (
	pembelianHTMLTemplate string
	penjualanHTMLTemplate string
	bulananHTMLTemplate   string
)

func main() {
	// Global error recovery
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Panic recovered: %v", r)
			os.Exit(1)
		}
	}()

	// Startup logging
	log.Println("Starting PDF API server...")
	log.Printf("Go version: %s", strings.TrimPrefix(fmt.Sprintf("%v", os.Getenv("GO_VERSION")), "go"))
	log.Printf("Working directory: %s", getCurrentDir())

	// Initialize chromedp
	if err := initializeChromedp(); err != nil {
		log.Printf("Warning: %v", err)
		if os.Getenv("NODE_ENV") == "production" {
			log.Fatalf("Failed to initialize chromedp in production: %v", err)
		}
	}

	// Load templates
	if err := loadTemplates(); err != nil {
		log.Fatalf("Failed to load templates: %v", err)
	}

	// Setup routes
	router := mux.NewRouter()
	router.HandleFunc("/health", healthHandler).Methods("GET")
	router.HandleFunc("/pembelian", pembelianHandler).Methods("POST")
	router.HandleFunc("/penjualan", penjualanHandler).Methods("POST")
	router.HandleFunc("/bulanan", bulananHandler).Methods("POST")

	// Get port from environment or default to 3000
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("🚀 PDF API server running on http://0.0.0.0:%s", port)
	log.Printf("✓ Health check endpoint: http://0.0.0.0:%s/health", port)
	log.Println("✓ Available endpoints:")
	log.Println("  - POST /pembelian")
	log.Println("  - POST /penjualan")
	log.Println("  - POST /bulanan")
	log.Println("Server started successfully!")

	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func getCurrentDir() string {
	dir, err := os.Getwd()
	if err != nil {
		return "unknown"
	}
	return dir
}

func initializeChromedp() error {
	// Check if Chromium/Chrome is available in various paths
	possiblePaths := []string{
		"/opt/google/chrome/chrome",                                    // Google Chrome in container
		"/usr/bin/google-chrome-stable",                                // Google Chrome stable
		"/usr/bin/google-chrome",                                       // Google Chrome
		"/usr/bin/chromium-browser",                                    // Chromium
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // macOS
	}

	for _, path := range possiblePaths {
		if _, err := os.Stat(path); err == nil {
			log.Printf("✓ Chrome/Chromium found at: %s", path)
			return nil
		}
	}

	// In development, just warn but don't fail
	if os.Getenv("NODE_ENV") != "production" {
		log.Println("⚠️ Chrome/Chromium not found - PDF generation will fail but server will start")
		return nil
	}

	return fmt.Errorf("Chrome/Chromium not found in common paths")
}

func loadTemplates() error {
	log.Println("Checking template files...")
	templateFiles := []string{"pembelian.html", "penjualan.html", "bulanan.html"}

	for _, file := range templateFiles {
		if _, err := os.Stat(file); os.IsNotExist(err) {
			return fmt.Errorf("template file not found: %s", file)
		}
		log.Printf("✓ Found template: %s", file)
	}

	var err error
	pembelianHTMLTemplate, err = readFileToString("pembelian.html")
	if err != nil {
		return fmt.Errorf("error reading pembelian.html: %v", err)
	}

	penjualanHTMLTemplate, err = readFileToString("penjualan.html")
	if err != nil {
		return fmt.Errorf("error reading penjualan.html: %v", err)
	}

	bulananHTMLTemplate, err = readFileToString("bulanan.html")
	if err != nil {
		return fmt.Errorf("error reading bulanan.html: %v", err)
	}

	log.Println("✓ All templates loaded successfully")
	return nil
}

func readFileToString(filename string) (string, error) {
	content, err := os.ReadFile(filename)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{
		"status":    "OK",
		"timestamp": time.Now().Format(time.RFC3339),
	}
	json.NewEncoder(w).Encode(response)
}

func pembelianHandler(w http.ResponseWriter, r *http.Request) {
	var payload PembelianPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	asHTML := r.URL.Query().Get("asHtml")
	html := fillPembelianTemplate(payload)

	if asHTML == "true" {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(html))
		return
	}

	pdfBuffer, err := generatePDF(html)
	if err != nil {
		log.Printf("Error generating PDF: %v", err)
		http.Error(w, fmt.Sprintf("Error generating PDF: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=Surat_Konfirmasi_Pembelian.pdf")
	w.Write(pdfBuffer)
}

func penjualanHandler(w http.ResponseWriter, r *http.Request) {
	var payload PenjualanPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	asHTML := r.URL.Query().Get("asHtml")
	html := fillPenjualanTemplate(payload)

	if asHTML == "true" {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(html))
		return
	}

	pdfBuffer, err := generatePDF(html)
	if err != nil {
		log.Printf("Error generating PDF: %v", err)
		http.Error(w, fmt.Sprintf("Error generating PDF: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=Surat_Konfirmasi_Penjualan.pdf")
	w.Write(pdfBuffer)
}

func bulananHandler(w http.ResponseWriter, r *http.Request) {
	var payload BulananPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	asHTML := r.URL.Query().Get("asHtml")
	html := fillBulananTemplate(payload)

	if asHTML == "true" {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(html))
		return
	}

	pdfBuffer, err := generatePDF(html)
	if err != nil {
		log.Printf("Error generating PDF: %v", err)
		http.Error(w, fmt.Sprintf("Error generating PDF: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=Surat_Konfirmasi_Bulanan.pdf")
	w.Write(pdfBuffer)
}

func generatePDF(html string) ([]byte, error) {
	// Create allocator options for headless Chrome with Cloud Run optimizations
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-software-rasterizer", true),
		chromedp.Flag("disable-background-timer-throttling", true),
		chromedp.Flag("disable-backgrounding-occluded-windows", true),
		chromedp.Flag("disable-renderer-backgrounding", true),
		chromedp.Flag("disable-features", "TranslateUI"),
		chromedp.Flag("disable-default-apps", true),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("disable-sync", true),
		chromedp.Flag("hide-scrollbars", true),
		chromedp.Flag("mute-audio", true),
		chromedp.Flag("no-first-run", true),
		chromedp.Flag("no-default-browser-check", true),
		chromedp.Flag("run-all-compositor-stages-before-draw", true),
		chromedp.Flag("disable-crash-reporter", true),
		chromedp.Flag("disable-logging", true),
		chromedp.Flag("disable-dev-tools", true),
		chromedp.Flag("disable-popup-blocking", true),
		chromedp.Flag("user-data-dir", "/tmp/chrome-user-data"),
		chromedp.Flag("data-path", "/tmp/chrome-data"),
		chromedp.Flag("disk-cache-dir", "/tmp/chrome-cache"),
	)

	// Add Cloud Run specific flags only in production
	if os.Getenv("NODE_ENV") == "production" {
		opts = append(opts,
			chromedp.Flag("single-process", true),
			chromedp.Flag("no-zygote", true),
			chromedp.Flag("disable-ipc-flooding-protection", true),
			chromedp.Flag("disable-background-networking", true),
			chromedp.Flag("disable-in-process-stack-traces", true),
			chromedp.Flag("disable-hang-monitor", true),
			chromedp.Flag("disable-client-side-phishing-detection", true),
			chromedp.Flag("disable-component-update", true),
			chromedp.Flag("remote-debugging-port", "0"),
		)
	}

	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	// Create a new context
	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	// Set timeout based on environment
	timeout := 30 * time.Second
	if os.Getenv("NODE_ENV") == "production" {
		timeout = 90 * time.Second // Longer timeout for Cloud Run
	}
	ctx, cancel = context.WithTimeout(ctx, timeout)
	defer cancel()

	var pdfBuffer []byte

	// Generate PDF using chromedp by setting HTML content directly
	err := chromedp.Run(ctx,
		chromedp.Navigate("about:blank"),
		chromedp.ActionFunc(func(ctx context.Context) error {
			frameTree, err := page.GetFrameTree().Do(ctx)
			if err != nil {
				return err
			}
			return page.SetDocumentContent(frameTree.Frame.ID, html).Do(ctx)
		}),
		chromedp.WaitReady("body"),
		chromedp.Sleep(2*time.Second), // Wait for content to render
		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			pdfBuffer, _, err = page.PrintToPDF().
				WithPrintBackground(true).
				WithPaperWidth(8.27).  // A4 width in inches
				WithPaperHeight(11.7). // A4 height in inches
				WithMarginTop(0.4).
				WithMarginBottom(0.4).
				WithMarginLeft(0.4).
				WithMarginRight(0.4).
				Do(ctx)
			return err
		}),
	)

	if err != nil {
		return nil, fmt.Errorf("failed to generate PDF: %v", err)
	}

	return pdfBuffer, nil
}

func fillPembelianTemplate(payload PembelianPayload) string {
	html := pembelianHTMLTemplate

	// Simple variable replacement
	replacements := map[string]string{
		"{{leftAddress.name}}":                   payload.LeftAddress.Name,
		"{{leftAddress.street}}":                 payload.LeftAddress.Street,
		"{{leftAddress.area}}":                   payload.LeftAddress.Area,
		"{{leftAddress.city}}":                   payload.LeftAddress.City,
		"{{leftAddress.country}}":                payload.LeftAddress.Country,
		"{{rightAddress.manager}}":               payload.RightAddress.Manager,
		"{{rightAddress.email}}":                 payload.RightAddress.Email,
		"{{rightAddress.transactionDate}}":       payload.RightAddress.TransactionDate,
		"{{transaction.type}}":                   payload.Transaction.Type,
		"{{transaction.number}}":                 payload.Transaction.Number,
		"{{transaction.amount}}":                 payload.Transaction.Amount,
		"{{transaction.fee}}":                    payload.Transaction.Fee,
		"{{transaction.ppnPercent}}":             payload.Transaction.PPNPercent,
		"{{transaction.ppnAmount}}":              payload.Transaction.PPNAmount,
		"{{transaction.product}}":                payload.Transaction.Product,
		"{{transaction.subscriptionFeePercent}}": payload.Transaction.SubscriptionFeePercent,
		"{{transaction.subscriptionFeeAmount}}":  payload.Transaction.SubscriptionFeeAmount,
		"{{transaction.netAmount}}":              payload.Transaction.NetAmount,
		"{{transaction.unit}}":                   payload.Transaction.Unit,
		"{{transaction.navPerUnit}}":             payload.Transaction.NAVPerUnit,
	}

	for placeholder, value := range replacements {
		html = strings.ReplaceAll(html, placeholder, value)
	}

	return html
}

func fillPenjualanTemplate(payload PenjualanPayload) string {
	html := penjualanHTMLTemplate

	replacements := map[string]string{
		"{{leftAddress.name}}":                 payload.LeftAddress.Name,
		"{{leftAddress.street}}":               payload.LeftAddress.Street,
		"{{leftAddress.area}}":                 payload.LeftAddress.Area,
		"{{leftAddress.city}}":                 payload.LeftAddress.City,
		"{{leftAddress.country}}":              payload.LeftAddress.Country,
		"{{rightAddress.manager}}":             payload.RightAddress.Manager,
		"{{rightAddress.email}}":               payload.RightAddress.Email,
		"{{rightAddress.transactionDate}}":     payload.RightAddress.TransactionDate,
		"{{transaction.type}}":                 payload.Transaction.Type,
		"{{transaction.number}}":               payload.Transaction.Number,
		"{{transaction.unit}}":                 payload.Transaction.Unit,
		"{{transaction.navPerUnit}}":           payload.Transaction.NAVPerUnit,
		"{{transaction.amount}}":               payload.Transaction.Amount,
		"{{transaction.fee}}":                  payload.Transaction.Fee,
		"{{transaction.pphPercent}}":           payload.Transaction.PPHPercent,
		"{{transaction.pphAmount}}":            payload.Transaction.PPHAmount,
		"{{transaction.product}}":              payload.Transaction.Product,
		"{{transaction.redemptionFeePercent}}": payload.Transaction.RedemptionFeePercent,
		"{{transaction.redemptionFeeAmount}}":  payload.Transaction.RedemptionFeeAmount,
		"{{transaction.netAmount}}":            payload.Transaction.NetAmount,
		"{{bank.name}}":                        payload.Bank.Name,
		"{{bank.account}}":                     payload.Bank.Account,
		"{{bank.accountName}}":                 payload.Bank.AccountName,
		"{{bank.verifiedAmount}}":              payload.Bank.VerifiedAmount,
		"{{bank.paymentDateTime}}":             payload.Bank.PaymentDateTime,
		"{{bank.reference}}":                   payload.Bank.Reference,
	}

	for placeholder, value := range replacements {
		html = strings.ReplaceAll(html, placeholder, value)
	}

	return html
}

func fillBulananTemplate(payload BulananPayload) string {
	html := bulananHTMLTemplate

	replacements := map[string]string{
		"{{leftAddress.name}}":         payload.LeftAddress.Name,
		"{{leftAddress.street}}":       payload.LeftAddress.Street,
		"{{leftAddress.area}}":         payload.LeftAddress.Area,
		"{{leftAddress.city}}":         payload.LeftAddress.City,
		"{{leftAddress.country}}":      payload.LeftAddress.Country,
		"{{rightAddress.manager}}":     payload.RightAddress.Manager,
		"{{rightAddress.email}}":       payload.RightAddress.Email,
		"{{product}}":                  payload.Product,
		"{{rightAddress.periodStart}}": payload.RightAddress.PeriodStart,
		"{{rightAddress.periodEnd}}":   payload.RightAddress.PeriodEnd,
	}

	for placeholder, value := range replacements {
		html = strings.ReplaceAll(html, placeholder, value)
	}

	// Handle transactions table
	var txRows strings.Builder
	for _, tx := range payload.Transactions {
		if tx.NoActivity {
			txRows.WriteString(`
				<tr class="c18">
					<td class="c20" colspan="6" rowspan="1">
						<p class="c10"><span class="c3">TIDAK TERDAPAT AKTIVITAS TRANSAKSI SELAMA PERIODE INI</span></p>
					</td>
				</tr>
			`)
		} else {
			txRows.WriteString(fmt.Sprintf(`
				<tr>
					<td class="c15" colspan="1" rowspan="1">
						<p class="c10"><span class="c3">%s</span></p>
					</td>
					<td class="c13" colspan="1" rowspan="1">
						<p class="c10"><span class="c3">%s</span></p>
					</td>
					<td class="c4" colspan="1" rowspan="1">
						<p class="c11 c14"><span class="c3">%s</span></p>
					</td>
					<td class="c4" colspan="1" rowspan="1">
						<p class="c8"><span class="c3">%s</span></p>
					</td>
					<td class="c4" colspan="1" rowspan="1">
						<p class="c8 c17"><span class="c3">%s</span></p>
					</td>
					<td class="c4" colspan="1" rowspan="1">
						<p class="c8"><span class="c3">%s</span></p>
					</td>
				</tr>
			`, tx.Date, tx.Description, tx.Number, tx.NAVPerUnit, tx.Unit, tx.MarketValue))
		}
	}

	// Replace the transactions placeholder
	re := regexp.MustCompile(`{{#transactions}}[\s\S]*?{{/transactions}}`)
	html = re.ReplaceAllString(html, txRows.String())

	return html
}
