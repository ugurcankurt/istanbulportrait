const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/checkout-form.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove imports
content = content.replace(/import \{ PaymentForm \} from "@\/components\/payment-form";\n/g, '');
content = content.replace(/import \{ TurinvoicePayment \} from "@\/components\/turinvoice-payment";\n/g, '');
content = content.replace(/trackAddPaymentInfo,\n/g, '');
content = content.replace(/import \{ getIyzicoErrorMessage \} from "@\/lib\/iyzico-errors";\n/g, '');
content = content.replace(/  PaymentFormData,\n/g, '');
content = content.replace(/  createPaymentSchema,\n/g, '');

// 2. Remove StepIndicator component entirely
content = content.replace(/\/\/ ─── Step Indicator ─+[\s\S]*?(?=\/\/ ─── Step 1: Booking Summary)/g, '');

// 3. Update Step1Summary props
content = content.replace(/onNext: \(\) => void;/g, 'onSubmit: () => void;\n  isSubmitting: boolean;');
content = content.replace(/onNext,/g, 'onSubmit,\n  isSubmitting,');

// 4. Update Step1Summary CTA
content = content.replace(
  /<Button onClick=\{onNext\} className="w-full h-14 rounded-2xl font-bold text-base shadow-sm">\s*\{t\("payment_method"\) \|\| "Choose Payment"\}\s*<ChevronRight className="w-5 h-5 ms-1 rtl:rotate-180" \/>\s*<\/Button>/g,
  `<Button onClick={onSubmit} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-bold text-base shadow-sm">\n          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (t("buttons.complete_booking") || "Complete Booking")}\n        </Button>`
);

// 5. Remove Step2Method and PriceStrip
content = content.replace(/\/\/ ─── Step 2: Payment Method ─+[\s\S]*?(?=\/\/ ─── Main CheckoutForm)/g, '');

// 6. Inside CheckoutForm:
// Remove currentStep state
content = content.replace(/const \[currentStep, setCurrentStep\] = useState\(1\);\n/g, '');
// Remove payment states
content = content.replace(/const \[paymentMethod, setPaymentMethod\] = useState<"iyzico" \| "turinvoice" \| "cash">.*?\n/g, '');
content = content.replace(/const \[turinvoiceOrder, setTurinvoiceOrder\] = useState<.*?\n.*?\n.*?\n.*?\n.*?\n  \} \| null>\(null\);\n/g, '');

// Remove paymentForm
content = content.replace(/const paymentSchemaWithTranslations = createPaymentSchema\(tValidation\);\n/g, '');
content = content.replace(/const paymentForm = useForm<PaymentFormData>\(\{\s*resolver: zodResolver\(paymentSchemaWithTranslations\),\s*defaultValues: \{\s*cardHolderName: "",\s*cardNumber: "",\s*expireMonth: "",\s*expireYear: "",\s*cvc: "",\s*\},\s*\}\);\n/g, '');

// Remove handlePaymentSubmit
content = content.replace(/const handlePaymentSubmit = async \(paymentData: PaymentFormData\) => \{[\s\S]*?\};\n\n  const handleCashPaymentSubmit/g, 'const handleCashPaymentSubmit');

// Remove handleTurinvoiceInitialize and handleTurinvoiceSuccess
content = content.replace(/const handleTurinvoiceInitialize = async \(\) => \{[\s\S]*?\};\n\n  const handleTurinvoiceSuccess = async \(\) => \{[\s\S]*?\};\n\n  \/\/ ── Success screen ──/g, '// ── Success screen ──');

// 7. Simplify rendering inside CheckoutForm return
content = content.replace(/<StepIndicator currentStep=\{currentStep\} labels=\{stepLabels\} \/>/g, '');
content = content.replace(/const stepLabels = \[[\s\S]*?\];\n/g, '');

// Replace the step content
const oldMainRender = /<main className="flex-1 overflow-y-auto px-4 py-4 min-h-0">[\s\S]*?<\/main>/g;
const newMainRender = `<main className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="max-w-lg mx-auto h-full flex flex-col">
          <Step1Summary
            t={t}
            tPricing={tPricing}
            tui={tui}
            locale={locale}
            preFilledBookingData={preFilledBookingData}
            packageInfo={packageInfo}
            selectedPackage={selectedPackage}
            promoCodeInput={promoCodeInput}
            setPromoCodeInput={setPromoCodeInput}
            appliedPromo={appliedPromo}
            setAppliedPromo={setAppliedPromo}
            promoError={promoError}
            isLoadingPromo={isLoadingPromo}
            handleApplyPromo={handleApplyPromo}
            onSubmit={handleCashPaymentSubmit}
            isSubmitting={isLoading}
            timeSurcharges={timeSurcharges}
          />
        </div>
      </main>`;
content = content.replace(oldMainRender, newMainRender);

// Replace Step Indicator block
content = content.replace(/\{\/\* ── Step Indicator ── \*\/\}\n\s*<div className="shrink-0 px-4 py-3 border-b bg-muted\/20">\n\s*<\/div>/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('checkout-form.tsx refactored successfully.');
