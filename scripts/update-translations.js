const fs = require('fs');

const enTranslations = {
  login: {
    title: "Welcome Back",
    description: "Login to view your photos and reservations.",
    email: "Email",
    emailPlaceholder: "name@example.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    forgotPassword: "Forgot password?",
    forgotPasswordAlert: "Please check the invite email sent when you completed your reservation, or contact support.",
    signIn: "Sign In",
    signingIn: "Signing in..."
  },
  updatePassword: {
    title: "Set Your Password",
    description: "Please secure your customer portal account by setting a new password.",
    newPassword: "New Password",
    newPasswordPlaceholder: "Enter new password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm new password",
    savePassword: "Save Password",
    saving: "Updating...",
    passwordMismatch: "Passwords do not match"
  },
  sidebar: {
    portal: "Customer Portal",
    myBookings: "My Bookings",
    payments: "Payments",
    logout: "Log out"
  },
  dashboard: {
    title: "My Bookings",
    description: "Manage your photography reservations and view your photo galleries.",
    upcoming: "Upcoming",
    past: "Past",
    viewGallery: "View Gallery",
    bookingDate: "Booking Date",
    noReservations: "No reservations found"
  },
  payments: {
    title: "Payments",
    description: "View your transaction history and outstanding balances.",
    noTransactions: "No transactions found",
    balanceDue: "Balance Due",
    fullyPaid: "Fully Paid",
    totalAmount: "Total Amount"
  },
  gallery: {
    title: "Photo Gallery",
    description: "Your high-resolution photos are ready.",
    downloadAll: "Download All",
    download: "Download",
    backToDashboard: "Back to Dashboard"
  }
};

const trTranslations = {
  login: {
    title: "Tekrar Hoş Geldiniz",
    description: "Fotoğraflarınızı ve rezervasyonlarınızı görüntülemek için giriş yapın.",
    email: "E-posta",
    emailPlaceholder: "isim@ornek.com",
    password: "Şifre",
    passwordPlaceholder: "Şifrenizi girin",
    forgotPassword: "Şifremi unuttum?",
    forgotPasswordAlert: "Lütfen rezervasyonunuzu tamamladığınızda gönderilen davet e-postasını kontrol edin veya destek ekibiyle iletişime geçin.",
    signIn: "Giriş Yap",
    signingIn: "Giriş yapılıyor..."
  },
  updatePassword: {
    title: "Şifrenizi Belirleyin",
    description: "Lütfen yeni bir şifre belirleyerek müşteri portalı hesabınızı güvene alın.",
    newPassword: "Yeni Şifre",
    newPasswordPlaceholder: "Yeni şifrenizi girin",
    confirmPassword: "Şifreyi Onayla",
    confirmPasswordPlaceholder: "Yeni şifrenizi tekrar girin",
    savePassword: "Şifreyi Kaydet",
    saving: "Güncelleniyor...",
    passwordMismatch: "Şifreler eşleşmiyor"
  },
  sidebar: {
    portal: "Müşteri Portali",
    myBookings: "Rezervasyonlarım",
    payments: "Ödemeler",
    logout: "Çıkış Yap"
  },
  dashboard: {
    title: "Rezervasyonlarım",
    description: "Fotoğraf çekimi rezervasyonlarınızı yönetin ve galerilerinizi görüntüleyin.",
    upcoming: "Yaklaşan",
    past: "Geçmiş",
    viewGallery: "Galeriyi Görüntüle",
    bookingDate: "Rezervasyon Tarihi",
    noReservations: "Hiç rezervasyon bulunamadı"
  },
  payments: {
    title: "Ödemeler",
    description: "İşlem geçmişinizi ve kalan bakiyelerinizi görüntüleyin.",
    noTransactions: "Hiç işlem bulunamadı",
    balanceDue: "Kalan Bakiye",
    fullyPaid: "Tamamı Ödendi",
    totalAmount: "Toplam Tutar"
  },
  gallery: {
    title: "Fotoğraf Galerisi",
    description: "Yüksek çözünürlüklü fotoğraflarınız hazır.",
    downloadAll: "Tümünü İndir",
    download: "İndir",
    backToDashboard: "Panele Dön"
  }
};

function updateJson(filePath, newAccountData) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  data.account = newAccountData;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log('Updated ' + filePath);
}

updateJson('messages/en.json', enTranslations);
updateJson('messages/tr.json', trTranslations);
