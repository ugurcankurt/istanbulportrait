// Comprehensive Iyzico Error Codes Mapping
// Based on official iyzico documentation and Excel data

export interface IyzicoErrorMapping {
  [key: string]: {
    en: string;
    tr: string;
    category: string;
    userFriendly: {
      en: string;
      tr: string;
      ar?: string;
      ru?: string;
      es?: string;
    };
    suggestion: {
      en: string;
      tr: string;
      ar?: string;
      ru?: string;
      es?: string;
    };
  };
}

export const IYZICO_ERROR_CODES: IyzicoErrorMapping = {
  // CRITICAL ERROR - The one causing production issues
  "10012": {
    en: "Invalid transaction",
    tr: "Geçersiz işlem",
    category: "SYSTEM_ERROR",
    userFriendly: {
      en: "An error occurred during the payment process, please contact your bank",
      tr: "Ödeme işlemi sırasında hata oluştu, bankanız ile irtibata geçiniz",
      ar: "حدث خطأ أثناء عملية الدفع، يرجى الاتصال بالبنك الخاص بك",
      ru: "Произошла ошибка во время обработки платежа, пожалуйста, свяжитесь с вашим банком",
      es: "Ocurrió un error durante el proceso de pago, por favor contacte con su banco",
    },
    suggestion: {
      en: "This is a card-related error. It is recommended that the cardholder contacts their bank",
      tr: "Kart kaynaklı hatadır, kart hamilinin bankası ile iletişime geçmesi tavsiye edilmektedir",
      ar: "هذا خطأ متعلق بالبطاقة. يُنصح حامل البطاقة بالاتصال بالبنك",
      ru: "Это ошибка, связанная с картой. Рекомендуется владельцу карты связаться с банком",
      es: "Este es un error relacionado con la tarjeta. Se recomienda que el titular de la tarjeta contacte con su banco",
    },
  },

  // INVALID_TRANSACTION Group
  "10005": {
    en: "Do not honor",
    tr: "İşlem reddedildi",
    category: "INVALID_TRANSACTION",
    userFriendly: {
      en: "Your bank has declined this transaction",
      tr: "Bankanız bu işlemi reddetti",
      ar: "رفض البنك هذه المعاملة",
      ru: "Ваш банк отклонил эту транзакцию",
      es: "Su banco ha rechazado esta transacción",
    },
    suggestion: {
      en: "Please contact your bank or try a different payment method",
      tr: "Lütfen bankanızla iletişime geçin veya farklı bir ödeme yöntemi deneyin",
      ar: "يرجى الاتصال بالبنك أو تجربة طريقة دفع مختلفة",
      ru: "Пожалуйста, свяжитесь с банком или попробуйте другой способ оплаты",
      es: "Por favor, contacte con su banco o pruebe un método de pago diferente",
    },
  },

  "10051": {
    en: "Insufficient card limit, insufficient balance",
    tr: "Kart limiti yetersiz, bakiye yetersiz",
    category: "INVALID_CARD",
    userFriendly: {
      en: "Your card doesn't have sufficient funds for this transaction",
      tr: "Kartınızda bu işlem için yeterli bakiye bulunmuyor",
      ar: "لا يوجد رصيد كافٍ في بطاقتك لهذه المعاملة",
      ru: "На вашей карте недостаточно средств для этой операции",
      es: "Su tarjeta no tiene fondos suficientes para esta transacción",
    },
    suggestion: {
      en: "Please check your card balance or try a different payment method",
      tr: "Lütfen kart bakiyenizi kontrol edin veya farklı bir ödeme yöntemi deneyin",
      ar: "يرجى التحقق من رصيد بطاقتك أو تجربة طريقة دفع مختلفة",
      ru: "Пожалуйста, проверьте баланс карты или попробуйте другой способ оплаты",
      es: "Por favor, verifique el saldo de su tarjeta o pruebe un método de pago diferente",
    },
  },

  "10084": {
    en: "Invalid Authorization Life Cycle",
    tr: "Geçersiz Yetkilendirme Yaşam Döngüsü",
    category: "INVALID_CARD",
    userFriendly: {
      en: "Transaction authorization has expired",
      tr: "İşlem yetkilendirme süresi dolmuş",
      ar: "انتهت صلاحية تفويض المعاملة",
      ru: "Срок авторизации транзакции истек",
      es: "La autorización de la transacción ha expirado",
    },
    suggestion: {
      en: "Please start the payment process again",
      tr: "Lütfen ödeme işlemini tekrar başlatın",
      ar: "يرجى بدء عملية الدفع مرة أخرى",
      ru: "Пожалуйста, начните процесс оплаты заново",
      es: "Por favor, inicie el proceso de pago nuevamente",
    },
  },

  "6001": {
    en: "Payment request has not passed Fraud check",
    tr: "Ödeme talebi dolandırıcılık denetiminden geçemedi",
    category: "FRAUD_CHECK",
    userFriendly: {
      en: "Payment blocked for security reasons",
      tr: "Ödeme güvenlik nedeniyle engellendi",
      ar: "تم حظر الدفع لأسباب أمنية",
      ru: "Платеж заблокирован по соображениям безопасности",
      es: "Pago bloqueado por razones de seguridad",
    },
    suggestion: {
      en: "Please try again or contact your bank to verify this transaction",
      tr: "Lütfen tekrar deneyin veya bu işlemi doğrulamak için bankanızla iletişime geçin",
      ar: "يرجى المحاولة مرة أخرى أو الاتصال بالبنك للتحقق من هذه المعاملة",
      ru: "Пожалуйста, попробуйте еще раз или обратитесь в банк для подтверждения транзакции",
      es: "Por favor, inténtelo de nuevo o contacte con su banco para verificar esta transacción",
    },
  },

  "5184": {
    en: "Local cards are invalid for foreign currency payments",
    tr: "Yerli kartlar yabancı para birimi ödemeleri için geçersizdir",
    category: "INVALID_CURRENCY",
    userFriendly: {
      en: "Your local card cannot be used for foreign currency payments",
      tr: "Yerli kartınız yabancı para birimi ödemeleri için kullanılamaz",
      ar: "لا يمكن استخدام بطاقتك المحلية للدفعات بالعملة الأجنبية",
      ru: "Ваша местная карта не может быть использована для платежей в иностранной валюте",
      es: "Su tarjeta local no se puede usar para pagos en moneda extranjera",
    },
    suggestion: {
      en: "Please use an international card or contact your bank about foreign currency transactions",
      tr: "Lütfen uluslararası bir kart kullanın veya yabancı para işlemleri hakkında bankanızla iletişime geçin",
      ar: "يرجى استخدام بطاقة دولية أو الاتصال بالبنك حول معاملات العملة الأجنبية",
      ru: "Пожалуйста, используйте международную карту или обратитесь в банк по поводу валютных операций",
      es: "Por favor, use una tarjeta internacional o contacte con su banco sobre transacciones en moneda extranjera",
    },
  },

  "10093": {
    en: "Your card is closed for online shopping, please contact your bank",
    tr: "Kartınız online alışverişe kapalı, lütfen bankanızla iletişime geçin",
    category: "INVALID_CARD",
    userFriendly: {
      en: "Your card is not enabled for online transactions",
      tr: "Kartınız online işlemlere açık değil",
      ar: "بطاقتك غير مُفعّلة للمعاملات عبر الإنترنت",
      ru: "Ваша карта не активирована для онлайн-транзакций",
      es: "Su tarjeta no está habilitada para transacciones en línea",
    },
    suggestion: {
      en: "Please contact your bank to enable online payments for your card",
      tr: "Kartınız için online ödeme özelliğini aktifleştirmek için bankanızla iletişime geçin",
      ar: "يرجى الاتصال بالبنك لتفعيل المدفوعات الإلكترونية لبطاقتك",
      ru: "Пожалуйста, свяжитесь с банком для активации онлайн-платежей для вашей карты",
      es: "Por favor, contacte con su banco para habilitar pagos en línea para su tarjeta",
    },
  },

  "10096": {
    en: "System malfunction",
    tr: "Sistem arızası",
    category: "INVALID_CARD",
    userFriendly: {
      en: "Payment system is temporarily down",
      tr: "Ödeme sistemi geçici olarak çalışmıyor",
      ar: "نظام الدفع معطل مؤقتاً",
      ru: "Платежная система временно недоступна",
      es: "El sistema de pago está temporalmente fuera de servicio",
    },
    suggestion: {
      en: "Please try again in a few minutes",
      tr: "Lütfen birkaç dakika sonra tekrar deneyin",
      ar: "يرجى المحاولة مرة أخرى خلال بضع دقائق",
      ru: "Пожалуйста, попробуйте еще раз через несколько минут",
      es: "Por favor, inténtelo de nuevo en unos minutos",
    },
  },

  "10201": {
    en: "Invalid card number",
    tr: "Geçersiz kart numarası",
    category: "INVALID_TRANSACTION",
    userFriendly: {
      en: "The card number you entered is invalid",
      tr: "Girdiğiniz kart numarası geçersiz",
      ar: "رقم البطاقة المدخل غير صحيح",
      ru: "Введенный номер карты недействителен",
      es: "El número de tarjeta ingresado es inválido",
    },
    suggestion: {
      en: "Please check your card number and try again",
      tr: "Lütfen kart numaranızı kontrol edin ve tekrar deneyin",
      ar: "يرجى التحقق من رقم بطاقتك والمحاولة مرة أخرى",
      ru: "Пожалуйста, проверьте номер карты и попробуйте еще раз",
      es: "Por favor, verifique el número de su tarjeta e inténtelo de nuevo",
    },
  },

  "10202": {
    en: "Card expired",
    tr: "Kartın süresi dolmuş",
    category: "INVALID_TRANSACTION",
    userFriendly: {
      en: "Your card has expired",
      tr: "Kartınızın süresi dolmuş",
      ar: "انتهت صلاحية بطاقتك",
      ru: "Срок действия вашей карты истек",
      es: "Su tarjeta ha expirado",
    },
    suggestion: {
      en: "Please use a different card or contact your bank for renewal",
      tr: "Lütfen farklı bir kart kullanın veya yenilemek için bankanızla iletişime geçin",
      ar: "يرجى استخدام بطاقة مختلفة أو الاتصال بالبنك للتجديد",
      ru: "Пожалуйста, используйте другую карту или обратитесь в банк за продлением",
      es: "Por favor, use una tarjeta diferente o contacte con su banco para renovarla",
    },
  },

  "10204": {
    en: "Invalid CVC",
    tr: "Geçersiz CVC",
    category: "INVALID_TRANSACTION",
    userFriendly: {
      en: "Security code (CVC) is incorrect",
      tr: "Güvenlik kodu (CVC) yanlış",
      ar: "رمز الأمان (CVC) غير صحيح",
      ru: "Код безопасности (CVC) неверен",
      es: "El código de seguridad (CVC) es incorrecto",
    },
    suggestion: {
      en: "Please check the 3-digit security code on the back of your card",
      tr: "Lütfen kartınızın arkasındaki 3 haneli güvenlik kodunu kontrol edin",
      ar: "يرجى التحقق من رمز الأمان المكون من 3 أرقام في الجزء الخلفي من البطاقة",
      ru: "Пожалуйста, проверьте 3-значный код безопасности на обратной стороне карты",
      es: "Por favor, verifique el código de seguridad de 3 dígitos en el reverso de su tarjeta",
    },
  },

  "10205": {
    en: "Invalid email format",
    tr: "E-posta geçerli formatta değil",
    category: "VALIDATION_ERROR",
    userFriendly: {
      en: "Email address format is invalid",
      tr: "E-posta adresi geçerli formatta değil",
      ar: "تنسيق عنوان البريد الإلكتروني غير صحيح",
      ru: "Неверный формат адреса электронной почты",
      es: "El formato de la dirección de email es inválido",
    },
    suggestion: {
      en: "Please check your email address and try again",
      tr: "Lütfen e-posta adresinizi kontrol edin ve tekrar deneyin",
      ar: "يرجى التحقق من عنوان بريدك الإلكتروني والمحاولة مرة أخرى",
      ru: "Пожалуйста, проверьте адрес электронной почты и попробуйте еще раз",
      es: "Por favor, verifique su dirección de email e inténtelo de nuevo",
    },
  },

  "10211": {
    en: "Invalid ECI information",
    tr: "Hatalı ECI bilgisi",
    category: "PAYMENT_ERROR",
    userFriendly: {
      en: "Payment security information error",
      tr: "Ödeme güvenlik bilgisi hatası",
      ar: "خطأ في معلومات أمان الدفع",
      ru: "Ошибка информации безопасности платежа",
      es: "Error en la información de seguridad del pago",
    },
    suggestion: {
      en: "Please contact your bank for assistance",
      tr: "Yardım için bankanızla iletişime geçin",
      ar: "يرجى الاتصال بالبنك للحصول على المساعدة",
      ru: "Пожалуйста, обратитесь в банк за помощью",
      es: "Por favor, contacte con su banco para obtener ayuda",
    },
  },

  "10212": {
    en: "CVC attempt limit exceeded",
    tr: "CVC yanlış girme deneme sayısı aşıldı",
    category: "CARD_BLOCKED",
    userFriendly: {
      en: "Too many incorrect CVC attempts",
      tr: "Çok fazla yanlış CVC denemesi",
      ar: "محاولات CVC خاطئة كثيرة جداً",
      ru: "Слишком много неверных попыток ввода CVC",
      es: "Demasiados intentos incorrectos de CVC",
    },
    suggestion: {
      en: "Please contact your bank to unlock your card",
      tr: "Kartınızın kilidini açmak için bankanızla iletişime geçin",
      ar: "يرجى الاتصال بالبنك لإلغاء قفل بطاقتك",
      ru: "Пожалуйста, обратитесь в банк для разблокировки карты",
      es: "Por favor, contacte con su banco para desbloquear su tarjeta",
    },
  },

  "10206": {
    en: "Invalid expiry date",
    tr: "Geçersiz son kullanma tarihi",
    category: "INVALID_TRANSACTION",
    userFriendly: {
      en: "Card expiry date is incorrect",
      tr: "Kart son kullanma tarihi yanlış",
      ar: "تاريخ انتهاء صلاحية البطاقة غير صحيح",
      ru: "Дата истечения срока действия карты неверна",
      es: "La fecha de vencimiento de la tarjeta es incorrecta",
    },
    suggestion: {
      en: "Please check the expiry date on your card (MM/YY format)",
      tr: "Lütfen kartınızdaki son kullanma tarihini kontrol edin (AA/YY formatında)",
      ar: "يرجى التحقق من تاريخ انتهاء الصلاحية في البطاقة (تنسيق MM/YY)",
      ru: "Пожалуйста, проверьте дату истечения срока действия на вашей карте (формат ММ/ГГ)",
      es: "Por favor, verifique la fecha de vencimiento en su tarjeta (formato MM/AA)",
    },
  },

  "10207": {
    en: "Insufficient funds",
    tr: "Yetersiz bakiye",
    category: "NOT_SUFFICIENT_FUNDS",
    userFriendly: {
      en: "Insufficient funds in your account",
      tr: "Hesabınızda yetersiz bakiye",
      ar: "رصيد غير كافي في حسابك",
      ru: "Недостаточно средств на вашем счете",
      es: "Fondos insuficientes en su cuenta",
    },
    suggestion: {
      en: "Please check your account balance or try a different payment method",
      tr: "Lütfen hesap bakiyenizi kontrol edin veya farklı bir ödeme yöntemi deneyin",
      ar: "يرجى التحقق من رصيد حسابك أو تجربة طريقة دفع مختلفة",
      ru: "Пожалуйста, проверьте баланс счета или попробуйте другой способ оплаты",
      es: "Por favor, verifique el saldo de su cuenta o pruebe un método de pago diferente",
    },
  },

  // NOT_SUFFICIENT_FUNDS Group
  "10034": {
    en: "Suspected fraud",
    tr: "Şüpheli işlem",
    category: "NOT_SUFFICIENT_FUNDS",
    userFriendly: {
      en: "Transaction flagged as potentially fraudulent",
      tr: "İşlem güvenlik nedeniyle engellendi",
      ar: "تم تمييز المعاملة كمشبوهة أمنياً",
      ru: "Транзакция помечена как потенциально мошенническая",
      es: "Transacción marcada como potencialmente fraudulenta",
    },
    suggestion: {
      en: "Please contact your bank to verify this transaction",
      tr: "Bu işlemi onaylamak için lütfen bankanızla iletişime geçin",
      ar: "يرجى الاتصال بالبنك للتحقق من هذه المعاملة",
      ru: "Пожалуйста, свяжитесь с банком для подтверждения этой транзакции",
      es: "Por favor, contacte con su banco para verificar esta transacción",
    },
  },

  "10054": {
    en: "Expiry date incorrect. Your card has expired",
    tr: "Son kullanma tarihi yanlış. Kartınızın süresi dolmuş",
    category: "CONTACT_BANK",
    userFriendly: {
      en: "Your card has expired",
      tr: "Kartınızın süresi dolmuş",
      ar: "انتهت صلاحية بطاقتك",
      ru: "Срок действия вашей карты истек",
      es: "Su tarjeta ha expirado",
    },
    suggestion: {
      en: "Please use a different card or contact your bank for a new one",
      tr: "Lütfen farklı bir kart kullanın veya yeni kart için bankanızla iletişime geçin",
      ar: "يرجى استخدام بطاقة مختلفة أو الاتصال بالبنك للحصول على بطاقة جديدة",
      ru: "Пожалуйста, используйте другую карту или обратитесь в банк за новой",
      es: "Por favor, use una tarjeta diferente o contacte con su banco para obtener una nueva",
    },
  },

  "10057": {
    en: "Transaction not permitted to cardholder",
    tr: "Kart sahibine izin verilmeyen işlem",
    category: "CONTACT_BANK",
    userFriendly: {
      en: "This type of transaction is not allowed for your card",
      tr: "Bu işlem türü kartınız için izin verilmiyor",
      ar: "هذا النوع من المعاملات غير مسموح لبطاقتك",
      ru: "Этот тип транзакции не разрешен для вашей карты",
      es: "Este tipo de transacción no está permitido para su tarjeta",
    },
    suggestion: {
      en: "Please contact your bank to enable this transaction type",
      tr: "Bu işlem türünü aktifleştirmek için bankanızla iletişime geçin",
      ar: "يرجى الاتصال بالبنك لتفعيل هذا النوع من المعاملات",
      ru: "Пожалуйста, свяжитесь с банком для активации этого типа транзакций",
      es: "Por favor, contacte con su banco para habilitar este tipo de transacción",
    },
  },

  "10058": {
    en: "Transaction not permitted to terminal",
    tr: "Terminal için izin verilmeyen işlem",
    category: "NOT_SUFFICIENT_FUNDS",
    userFriendly: {
      en: "Transaction not permitted at this merchant",
      tr: "Bu işyerinde işleme izin verilmiyor",
      ar: "المعاملة غير مسموحة في هذا التاجر",
      ru: "Транзакция не разрешена у этого продавца",
      es: "Transacción no permitida en este comercio",
    },
    suggestion: {
      en: "Please try a different payment method",
      tr: "Lütfen farklı bir ödeme yöntemi deneyin",
      ar: "يرجى تجربة طريقة دفع مختلفة",
      ru: "Пожалуйста, попробуйте другой способ оплаты",
      es: "Por favor, pruebe un método de pago diferente",
    },
  },

  "10059": {
    en: "Suspected fraud",
    tr: "Şüpheli işlem",
    category: "NOT_SUFFICIENT_FUNDS",
    userFriendly: {
      en: "Transaction flagged for security reasons",
      tr: "İşlem güvenlik nedeniyle işaretlendi",
      ar: "تم تمييز المعاملة لأسباب أمنية",
      ru: "Транзакция помечена по соображениям безопасности",
      es: "Transacción marcada por razones de seguridad",
    },
    suggestion: {
      en: "Please contact your bank to verify and authorize this transaction",
      tr: "Bu işlemi doğrulamak ve yetkilendirmek için bankanızla iletişime geçin",
      ar: "يرجى الاتصال بالبنك للتحقق من هذه المعاملة وتفويضها",
      ru: "Пожалуйста, свяжитесь с банком для проверки и авторизации этой транзакции",
      es: "Por favor, contacte con su banco para verificar y autorizar esta transacción",
    },
  },

  // SYSTEM_ERROR Group
  "10208": {
    en: "System error",
    tr: "Sistem hatası",
    category: "SYSTEM_ERROR",
    userFriendly: {
      en: "A system error occurred during payment processing",
      tr: "Ödeme işlemi sırasında sistem hatası oluştu",
      ar: "حدث خطأ في النظام أثناء معالجة الدفع",
      ru: "Произошла системная ошибка во время обработки платежа",
      es: "Ocurrió un error del sistema durante el procesamiento del pago",
    },
    suggestion: {
      en: "Please try again later or contact customer support",
      tr: "Lütfen daha sonra tekrar deneyin veya müşteri hizmetleri ile iletişime geçin",
      ar: "يرجى المحاولة مرة أخرى لاحقاً أو الاتصال بدعم العملاء",
      ru: "Пожалуйста, попробуйте позже или обратитесь в службу поддержки",
      es: "Por favor, inténtelo de nuevo más tarde o contacte con atención al cliente",
    },
  },

  "10209": {
    en: "Transaction timeout",
    tr: "İşlem zaman aşımı",
    category: "SYSTEM_ERROR",
    userFriendly: {
      en: "Transaction timed out",
      tr: "İşlem zaman aşımına uğradı",
      ar: "انتهت مهلة المعاملة",
      ru: "Время ожидания транзакции истекло",
      es: "La transacción ha agotado el tiempo límite",
    },
    suggestion: {
      en: "Please try the payment again",
      tr: "Lütfen ödemeyi tekrar deneyin",
      ar: "يرجى تجربة الدفع مرة أخرى",
      ru: "Пожалуйста, попробуйте оплатить еще раз",
      es: "Por favor, intente el pago nuevamente",
    },
  },

  "10210": {
    en: "Network error",
    tr: "Ağ hatası",
    category: "SYSTEM_ERROR",
    userFriendly: {
      en: "Network connection error occurred",
      tr: "Ağ bağlantısı hatası oluştu",
      ar: "حدث خطأ في اتصال الشبكة",
      ru: "Произошла ошибка сетевого подключения",
      es: "Ocurrió un error de conexión de red",
    },
    suggestion: {
      en: "Please check your internet connection and try again",
      tr: "Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin",
      ar: "يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى",
      ru: "Пожалуйста, проверьте подключение к интернету и попробуйте еще раз",
      es: "Por favor, verifique su conexión a internet e inténtelo de nuevo",
    },
  },

  "10215": {
    en: "Invalid card number",
    tr: "Geçersiz kart numarası",
    category: "CARD_ERROR",
    userFriendly: {
      en: "The card number you entered is invalid",
      tr: "Girdiğiniz kart numarası geçersiz",
      ar: "رقم البطاقة المدخل غير صحيح",
      ru: "Введенный номер карты недействителен",
      es: "El número de tarjeta ingresado es inválido",
    },
    suggestion: {
      en: "Please check your card number and try again",
      tr: "Lütfen kart numaranızı kontrol edin ve tekrar deneyin",
      ar: "يرجى التحقق من رقم بطاقتك والمحاولة مرة أخرى",
      ru: "Пожалуйста, проверьте номер карты и попробуйте еще раз",
      es: "Por favor, verifique el número de su tarjeta e inténtelo de nuevo",
    },
  },

  "10216": {
    en: "Bank not found",
    tr: "Bankası bulunamadı",
    category: "BANK_ERROR",
    userFriendly: {
      en: "Your card's bank is temporarily unavailable",
      tr: "Kartınızın bankası geçici olarak kullanılamıyor",
      ar: "بنك بطاقتك غير متاح مؤقتاً",
      ru: "Банк вашей карты временно недоступен",
      es: "El banco de su tarjeta no está disponible temporalmente",
    },
    suggestion: {
      en: "Please try again later or use a different card",
      tr: "Lütfen daha sonra tekrar deneyin veya farklı bir kart kullanın",
      ar: "يرجى المحاولة لاحقاً أو استخدام بطاقة مختلفة",
      ru: "Пожалуйста, попробуйте позже или используйте другую карту",
      es: "Por favor, inténtelo más tarde o use una tarjeta diferente",
    },
  },

  "10219": {
    en: "Request timeout",
    tr: "Bankaya gönderilen istek zaman aşımına uğradı",
    category: "TIMEOUT_ERROR",
    userFriendly: {
      en: "Request to your bank timed out",
      tr: "Bankanıza gönderilen istek zaman aşımına uğradı",
      ar: "انتهت مهلة الطلب المرسل إلى البنك",
      ru: "Время ожидания запроса к банку истекло",
      es: "La solicitud al banco ha agotado el tiempo límite",
    },
    suggestion: {
      en: "Please try again later",
      tr: "Lütfen daha sonra tekrar deneyin",
      ar: "يرجى المحاولة مرة أخرى لاحقاً",
      ru: "Пожалуйста, попробуйте еще раз позже",
      es: "Por favor, inténtelo de nuevo más tarde",
    },
  },

  "10220": {
    en: "Payment declined",
    tr: "Ödeme alınamadı",
    category: "PAYMENT_DECLINED",
    userFriendly: {
      en: "Payment was declined",
      tr: "Ödeme reddedildi",
      ar: "تم رفض الدفع",
      ru: "Платеж был отклонен",
      es: "El pago fue rechazado",
    },
    suggestion: {
      en: "Please try again or contact your bank",
      tr: "Lütfen tekrar deneyin veya bankanızla iletişime geçin",
      ar: "يرجى المحاولة مرة أخرى أو الاتصال بالبنك",
      ru: "Пожалуйста, попробуйте еще раз или обратитесь в банк",
      es: "Por favor, inténtelo de nuevo o contacte con su banco",
    },
  },

  "10224": {
    en: "Transaction limit exceeded",
    tr: "Para çekme limiti aşılmış",
    category: "LIMIT_EXCEEDED",
    userFriendly: {
      en: "Your card's transaction limit has been exceeded",
      tr: "Kartınızın işlem limiti aşıldı",
      ar: "تم تجاوز حد معاملات بطاقتك",
      ru: "Превышен лимит транзакций вашей карты",
      es: "Se ha excedido el límite de transacciones de su tarjeta",
    },
    suggestion: {
      en: "Please contact your bank to increase your limit or try a smaller amount",
      tr: "Limitinizi artırmak için bankanızla iletişime geçin veya daha düşük tutarla deneyin",
      ar: "يرجى الاتصال بالبنك لزيادة الحد أو تجربة مبلغ أقل",
      ru: "Пожалуйста, обратитесь в банк для увеличения лимита или попробуйте меньшую сумму",
      es: "Por favor, contacte con su banco para aumentar su límite o pruebe con un monto menor",
    },
  },

  "10225": {
    en: "Restricted card",
    tr: "Kısıtlı kart",
    category: "CARD_RESTRICTED",
    userFriendly: {
      en: "Your card is restricted for this transaction",
      tr: "Kartınız bu işlem için kısıtlıdır",
      ar: "بطاقتك مقيدة لهذه المعاملة",
      ru: "Ваша карта ограничена для этой транзакции",
      es: "Su tarjeta está restringida para esta transacción",
    },
    suggestion: {
      en: "Please contact your bank to remove restrictions",
      tr: "Kısıtlamaları kaldırmak için bankanızla iletişime geçin",
      ar: "يرجى الاتصال بالبنك لإزالة القيود",
      ru: "Пожалуйста, обратитесь в банк для снятия ограничений",
      es: "Por favor, contacte con su banco para eliminar las restricciones",
    },
  },

  "10227": {
    en: "Invalid PIN",
    tr: "Geçersiz PIN",
    category: "CARD_ERROR",
    userFriendly: {
      en: "PIN number is incorrect",
      tr: "PIN numarası yanlış",
      ar: "رقم PIN غير صحيح",
      ru: "PIN-код неверен",
      es: "El número PIN es incorrecto",
    },
    suggestion: {
      en: "Please try again with the correct PIN",
      tr: "Lütfen doğru PIN ile tekrar deneyin",
      ar: "يرجى المحاولة مرة أخرى بـ PIN الصحيح",
      ru: "Пожалуйста, попробуйте еще раз с правильным PIN-кодом",
      es: "Por favor, inténtelo de nuevo con el PIN correcto",
    },
  },

  "10229": {
    en: "Invalid expiration date",
    tr: "Son kullanma tarihi geçersiz",
    category: "CARD_ERROR",
    userFriendly: {
      en: "Card expiration date is incorrect",
      tr: "Kart son kullanma tarihi hatalı",
      ar: "تاريخ انتهاء صلاحية البطاقة غير صحيح",
      ru: "Дата истечения срока действия карты неверна",
      es: "La fecha de vencimiento de la tarjeta es incorrecta",
    },
    suggestion: {
      en: "Please check the expiration date and try again",
      tr: "Lütfen son kullanma tarihini kontrol edin ve tekrar deneyin",
      ar: "يرجى التحقق من تاريخ انتهاء الصلاحية والمحاولة مرة أخرى",
      ru: "Пожалуйста, проверьте дату истечения срока действия и попробуйте еще раз",
      es: "Por favor, verifique la fecha de vencimiento e inténtelo de nuevo",
    },
  },

  // Foreign Amex cards not accepted in Turkey
  "10235": {
    en: "Amex cards are not accepted in Turkey",
    tr: "Amex kartları Türkiye'de kabul edilmemektedir",
    category: "INVALID_CARD",
    userFriendly: {
      en: "American Express cards are not accepted for payments in Turkey",
      tr: "American Express kartları Türkiye'de ödemeler için kabul edilmemektedir",
      ar: "بطاقات أمريكان إكسبريس غير مقبولة للمدفوعات في تركيا",
      ru: "Карты American Express не принимаются для платежей в Турции",
      es: "Las tarjetas American Express no son aceptadas para pagos en Turquía",
    },
    suggestion: {
      en: "Please use a Visa or Mastercard for payment",
      tr: "Lütfen ödeme için Visa veya Mastercard kullanın",
      ar: "يرجى استخدام بطاقة فيزا أو ماستر كارد للدفع",
      ru: "Пожалуйста, используйте карту Visa или Mastercard для оплаты",
      es: "Por favor, use una tarjeta Visa o Mastercard para el pago",
    },
  },

  // Critical Missing Bank Error Codes from Official Documentation
  "10041": {
    en: "Lost card, pick up",
    tr: "Kayıp kart, karta el koyunuz",
    category: "SECURITY_BLOCK",
    userFriendly: {
      en: "This card has been reported as lost",
      tr: "Bu kart kayıp olarak bildirilmiş",
      ar: "تم الإبلاغ عن فقدان هذه البطاقة",
      ru: "Эта карта была заявлена как утерянная",
      es: "Esta tarjeta ha sido reportada como perdida",
    },
    suggestion: {
      en: "Please use a different card or contact your bank",
      tr: "Lütfen farklı bir kart kullanın veya bankanızla iletişime geçin",
      ar: "يرجى استخدام بطاقة مختلفة أو الاتصال بالبنك",
      ru: "Пожалуйста, используйте другую карту или обратитесь в банк",
      es: "Por favor, use una tarjeta diferente o contacte con su banco",
    },
  },

  "10043": {
    en: "Stolen card, pick up",
    tr: "Çalıntı kart, karta el koyunuz",
    category: "SECURITY_BLOCK",
    userFriendly: {
      en: "This card has been reported as stolen",
      tr: "Bu kart çalıntı olarak bildirilmiş",
      ar: "تم الإبلاغ عن سرقة هذه البطاقة",
      ru: "Эта карта была заявлена как украденная",
      es: "Esta tarjeta ha sido reportada como robada",
    },
    suggestion: {
      en: "Please use a different card or contact your bank immediately",
      tr: "Lütfen farklı bir kart kullanın veya derhal bankanızla iletişime geçin",
      ar: "يرجى استخدام بطاقة مختلفة أو الاتصال بالبنك فوراً",
      ru: "Пожалуйста, используйте другую карту или немедленно обратитесь в банк",
      es: "Por favor, use una tarjeta diferente o contacte con su banco inmediatamente",
    },
  },

  "10055": {
    en: "Incorrect PIN",
    tr: "Yanlış PIN",
    category: "CARD_RESTRICTED",
    userFriendly: {
      en: "Incorrect PIN entered",
      tr: "Yanlış PIN girildi",
      ar: "تم إدخال رقم PIN خاطئ",
      ru: "Введен неверный PIN-код",
      es: "Se ingresó un PIN incorrecto",
    },
    suggestion: {
      en: "Please enter the correct PIN or try again",
      tr: "Lütfen doğru PIN'i girin veya tekrar deneyin",
      ar: "يرجى إدخال رقم PIN الصحيح أو المحاولة مرة أخرى",
      ru: "Пожалуйста, введите правильный PIN-код или попробуйте еще раз",
      es: "Por favor, ingrese el PIN correcto o inténtelo de nuevo",
    },
  },

  "10061": {
    en: "Exceeds withdrawal amount limit",
    tr: "Çekme tutarı limitini aşıyor",
    category: "INSUFFICIENT_FUNDS",
    userFriendly: {
      en: "Transaction amount exceeds your card limit",
      tr: "İşlem tutarı kart limitinizi aşıyor",
      ar: "مبلغ المعاملة يتجاوز حد بطاقتك",
      ru: "Сумма транзакции превышает лимит вашей карты",
      es: "El monto de la transacción excede el límite de su tarjeta",
    },
    suggestion: {
      en: "Please try a smaller amount or contact your bank to increase limit",
      tr: "Lütfen daha düşük bir tutar deneyin veya limit artırmak için bankanızla iletişime geçin",
      ar: "يرجى تجربة مبلغ أقل أو الاتصال بالبنك لزيادة الحد",
      ru: "Пожалуйста, попробуйте меньшую сумму или обратитесь в банк для увеличения лимита",
      es: "Por favor, intente con un monto menor o contacte con su banco para aumentar el límite",
    },
  },

  "10065": {
    en: "Exceeds withdrawal frequency limit",
    tr: "Çekme sıklığı limitini aşıyor",
    category: "CARD_RESTRICTED",
    userFriendly: {
      en: "You have exceeded the transaction frequency limit",
      tr: "İşlem sıklığı limitini aştınız",
      ar: "لقد تجاوزت حد تكرار المعاملات",
      ru: "Вы превысили лимит частоты транзакций",
      es: "Ha excedido el límite de frecuencia de transacciones",
    },
    suggestion: {
      en: "Please wait and try again later, or contact your bank",
      tr: "Lütfen bekleyip daha sonra tekrar deneyin veya bankanızla iletişime geçin",
      ar: "يرجى الانتظار والمحاولة لاحقاً، أو الاتصال بالبنك",
      ru: "Пожалуйста, подождите и попробуйте позже, или обратитесь в банк",
      es: "Por favor, espere e inténtelo más tarde, o contacte con su banco",
    },
  },

  "10075": {
    en: "PIN try limit exceeded",
    tr: "PIN deneme limiti aşıldı",
    category: "SECURITY_BLOCK",
    userFriendly: {
      en: "You have exceeded the PIN attempt limit",
      tr: "PIN deneme limitini aştınız",
      ar: "لقد تجاوزت حد محاولات رقم PIN",
      ru: "Вы превысили лимит попыток ввода PIN-кода",
      es: "Ha excedido el límite de intentos de PIN",
    },
    suggestion: {
      en: "Please contact your bank to unlock your card",
      tr: "Kartınızın kilidini açmak için bankanızla iletişime geçin",
      ar: "يرجى الاتصال بالبنك لإلغاء قفل بطاقتك",
      ru: "Пожалуйста, обратитесь в банк для разблокировки карты",
      es: "Por favor, contacte con su banco para desbloquear su tarjeta",
    },
  },

  "10091": {
    en: "Issuer or switch is inoperative",
    tr: "Kartı veren kurum veya switch çalışmıyor",
    category: "BANK_ERROR",
    userFriendly: {
      en: "Your bank's systems are temporarily unavailable",
      tr: "Bankanızın sistemleri geçici olarak kullanılamıyor",
      ar: "أنظمة البنك الخاص بك غير متاحة مؤقتاً",
      ru: "Системы вашего банка временно недоступны",
      es: "Los sistemas de su banco están temporalmente no disponibles",
    },
    suggestion: {
      en: "Please try again later or use a different payment method",
      tr: "Lütfen daha sonra tekrar deneyin veya farklı bir ödeme yöntemi kullanın",
      ar: "يرجى المحاولة لاحقاً أو استخدام طريقة دفع مختلفة",
      ru: "Пожалуйста, попробуйте позже или используйте другой способ оплаты",
      es: "Por favor, inténtelo más tarde o use un método de pago diferente",
    },
  },

  "10092": {
    en: "Financial institution or intermediate network facility cannot be found for routing",
    tr: "Finansal kurum veya ara ağ tesisi yönlendirme için bulunamıyor",
    category: "BANK_ERROR",
    userFriendly: {
      en: "Payment network issue",
      tr: "Ödeme ağı sorunu",
      ar: "مشكلة في شبكة الدفع",
      ru: "Проблема с платежной сетью",
      es: "Problema de red de pagos",
    },
    suggestion: {
      en: "Please try again later or use a different card",
      tr: "Lütfen daha sonra tekrar deneyin veya farklı bir kart kullanın",
      ar: "يرجى المحاولة لاحقاً أو استخدام بطاقة مختلفة",
      ru: "Пожалуйста, попробуйте позже или используйте другую карту",
      es: "Por favor, inténtelo más tarde o use una tarjeta diferente",
    },
  },

  "10217": {
    en: "Debit cards requires 3DS",
    tr: "Banka kartları sadece 3D Secure işleminde kullanılabilir",
    category: "CARD_RESTRICTED",
    userFriendly: {
      en: "Debit cards can only be used with 3D Secure",
      tr: "Banka kartları sadece 3D Secure ile kullanılabilir",
      ar: "بطاقات الخصم يمكن استخدامها فقط مع 3D Secure",
      ru: "Дебетовые карты можно использовать только с 3D Secure",
      es: "Las tarjetas de débito solo se pueden usar con 3D Secure",
    },
    suggestion: {
      en: "Transaction must be processed with 3D Secure",
      tr: "İşlem 3D olarak gerçekleştirilmelidir",
      ar: "يجب معالجة المعاملة مع 3D Secure",
      ru: "Транзакция должна быть обработана с 3D Secure",
      es: "La transacción debe procesarse con 3D Secure",
    },
  },

  "10218": {
    en: "Debit cards installment not allowed",
    tr: "Banka kartları ile taksit yapılamaz",
    category: "CARD_RESTRICTED",
    userFriendly: {
      en: "Installment payments are not available for debit cards",
      tr: "Banka kartları ile taksit yapılamaz",
      ar: "الدفع على أقساط غير متاح لبطاقات الخصم",
      ru: "Рассрочка недоступна для дебетовых карт",
      es: "Los pagos a plazos no están disponibles para tarjetas de débito",
    },
    suggestion: {
      en: "Please try again without installment or use a credit card",
      tr: "Lütfen taksitsiz tekrar deneyin veya kredi kartı kullanın",
      ar: "يرجى المحاولة مرة أخرى بدون أقساط أو استخدام بطاقة ائتمان",
      ru: "Пожалуйста, попробуйте без рассрочки или используйте кредитную карту",
      es: "Por favor, inténtelo sin plazos o use una tarjeta de crédito",
    },
  },

  // Legacy error codes for backward compatibility
  "5": {
    en: "Do not honor",
    tr: "İşlem reddedildi",
    category: "general",
    userFriendly: {
      en: "Transaction was declined",
      tr: "İşlem reddedildi",
      ar: "تم رفض المعاملة",
      ru: "Транзакция была отклонена",
      es: "La transacción fue rechazada",
    },
    suggestion: {
      en: "Please contact your bank or try a different payment method",
      tr: "Lütfen bankanızla iletişime geçin veya farklı bir ödeme yöntemi deneyin",
      ar: "يرجى الاتصال بالبنك أو تجربة طريقة دفع مختلفة",
      ru: "Пожалуйста, свяжитесь с банком или попробуйте другой способ оплаты",
      es: "Por favor, contacte con su banco o pruebe un método de pago diferente",
    },
  },

  "14": {
    en: "Invalid card number",
    tr: "Geçersiz kart numarası",
    category: "validation",
    userFriendly: {
      en: "The card number you entered is invalid",
      tr: "Girdiğiniz kart numarası geçersiz",
      ar: "رقم البطاقة المدخل غير صحيح",
      ru: "Введенный номер карты недействителен",
      es: "El número de tarjeta ingresado es inválido",
    },
    suggestion: {
      en: "Please check your card number and try again",
      tr: "Lütfen kart numaranızı kontrol edin ve tekrar deneyin",
      ar: "يرجى التحقق من رقم بطاقتك والمحاولة مرة أخرى",
      ru: "Пожалуйста, проверьте номер карты и попробуйте еще раз",
      es: "Por favor, verifique el número de su tarjeta e inténtelo de nuevo",
    },
  },

  "51": {
    en: "Not sufficient funds",
    tr: "Yetersiz bakiye",
    category: "bank",
    userFriendly: {
      en: "Insufficient funds on your card",
      tr: "Kartınızda yetersiz bakiye",
      ar: "رصيد غير كافي في بطاقتك",
      ru: "Недостаточно средств на вашей карте",
      es: "Fondos insuficientes en su tarjeta",
    },
    suggestion: {
      en: "Please check your balance or use a different payment method",
      tr: "Lütfen bakiyenizi kontrol edin veya farklı bir ödeme yöntemi kullanın",
      ar: "يرجى التحقق من رصيدك أو استخدام طريقة دفع مختلفة",
      ru: "Пожалуйста, проверьте баланс или используйте другой способ оплаты",
      es: "Por favor, verifique su saldo o use un método de pago diferente",
    },
  },

  "54": {
    en: "Expired card",
    tr: "Süresi dolmuş kart",
    category: "bank",
    userFriendly: {
      en: "Your card has expired",
      tr: "Kartınızın süresi dolmuş",
      ar: "انتهت صلاحية بطاقتك",
      ru: "Срок действия вашей карты истек",
      es: "Su tarjeta ha expirado",
    },
    suggestion: {
      en: "Please use a different card or contact your bank",
      tr: "Lütfen farklı bir kart kullanın veya bankanızla iletişime geçin",
      ar: "يرجى استخدام بطاقة مختلفة أو الاتصال بالبنك",
      ru: "Пожалуйста, используйте другую карту или обратитесь в банк",
      es: "Por favor, use una tarjeta diferente o contacte con su banco",
    },
  },

  // iyzico Specific Error Codes
  DEMO_INVALID_CARD: {
    en: "Demo mode: Use test card 5528790000000008 for successful payment",
    tr: "Demo modu: Başarılı ödeme için test kartı 5528790000000008 kullanın",
    category: "demo",
    userFriendly: {
      en: "Please use the test card for demo payments",
      tr: "Demo ödemeler için lütfen test kartını kullanın",
      ar: "يرجى استخدام بطاقة الاختبار للمدفوعات التجريبية",
      ru: "Пожалуйста, используйте тестовую карту для демо-платежей",
      es: "Por favor, use la tarjeta de prueba para pagos de demostración",
    },
    suggestion: {
      en: "Use card number: 5528790000000008",
      tr: "Kart numarası kullanın: 5528790000000008",
      ar: "استخدم رقم البطاقة: 5528790000000008",
      ru: "Используйте номер карты: 5528790000000008",
      es: "Use el número de tarjeta: 5528790000000008",
    },
  },

  INVALID_REQUEST: {
    en: "Invalid request parameters",
    tr: "Geçersiz istek parametreleri",
    category: "validation",
    userFriendly: {
      en: "Payment information is incomplete",
      tr: "Ödeme bilgileri eksik",
      ar: "معلومات الدفع غير مكتملة",
      ru: "Информация о платеже неполная",
      es: "La información de pago está incompleta",
    },
    suggestion: {
      en: "Please check all payment details and try again",
      tr: "Lütfen tüm ödeme bilgilerini kontrol edin ve tekrar deneyin",
      ar: "يرجى التحقق من جميع تفاصيل الدفع والمحاولة مرة أخرى",
      ru: "Пожалуйста, проверьте все детали платежа и попробуйте еще раз",
      es: "Por favor, verifique todos los detalles de pago e inténtelo de nuevo",
    },
  },
};

// Helper function to get user-friendly error message
export function getIyzicoErrorMessage(
  errorCode: string,
  language: string = "en",
): {
  message: string;
  suggestion: string;
  category: string;
} {
  const error = IYZICO_ERROR_CODES[errorCode];

  if (!error) {
    // Fallback for unknown error codes with multi-language support
    const fallbackMessages = {
      en: "An unknown error occurred",
      tr: "Bilinmeyen bir hata oluştu",
      ar: "حدث خطأ غير معروف",
      ru: "Произошла неизвестная ошибка",
      es: "Ocurrió un error desconocido",
    };

    const fallbackSuggestions = {
      en: "Please try again or contact customer support",
      tr: "Lütfen tekrar deneyin veya müşteri hizmetleri ile iletişime geçin",
      ar: "يرجى المحاولة مرة أخرى أو الاتصال بدعم العملاء",
      ru: "Пожалуйста, попробуйте еще раз или обратитесь в службу поддержки",
      es: "Por favor, inténtalo de nuevo o contacta con soporte",
    };

    // Safe key lookup with proper fallback
    const safeLanguage =
      language in fallbackMessages
        ? (language as keyof typeof fallbackMessages)
        : "en";

    return {
      message: fallbackMessages[safeLanguage],
      suggestion: fallbackSuggestions[safeLanguage],
      category: "unknown",
    };
  }

  // Get message based on language with proper fallback handling
  let message: string;
  let suggestion: string;

  switch (language) {
    case "tr":
      message = error.userFriendly.tr || error.userFriendly.en;
      suggestion = error.suggestion.tr || error.suggestion.en;
      break;
    case "ar":
      message = error.userFriendly.ar || error.userFriendly.en;
      suggestion = error.suggestion.ar || error.suggestion.en;
      break;
    case "ru":
      message = error.userFriendly.ru || error.userFriendly.en;
      suggestion = error.suggestion.ru || error.suggestion.en;
      break;
    case "es":
      message = error.userFriendly.es || error.userFriendly.en;
      suggestion = error.suggestion.es || error.suggestion.en;
      break;
    default:
      message = error.userFriendly.en;
      suggestion = error.suggestion.en;
      break;
  }

  return {
    message,
    suggestion,
    category: error.category,
  };
}

// Map locale to iyzico locale format
export function mapLocaleToIyzico(locale: string): string {
  switch (locale) {
    case "tr":
      return "tr";
    case "en":
    case "es":
    case "ru":
    case "ar":
      return "en"; // iyzico only supports tr/en
    default:
      return "en";
  }
}
