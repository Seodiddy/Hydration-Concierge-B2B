// UI strings for the B2B advisor — EN / DE / ES / FR
// Deliberately minimal: no booking/session strings needed.

export const I18N = {
  en: {
    heroWords: ['Upgrade.', 'Recovery.', 'Performance.'],
    heroTagline: 'MOLECULAR HYDROGEN · BACKED BY SCIENCE',
    heroSubline: 'Your H2 device advisor.',
    openingQuestion: 'Have you come across molecular hydrogen before, or is this new to you?',
    openingOptions: ['Yes, I know it well', 'I\'ve heard about it', 'Brand new to me'],
    typeYourOwn: 'Or type your own answer…',
    errorRetry: 'Could not connect. Please try again.',
    retryLabel: 'Try again',
    viewRecommendation: 'View my recommendation →',
    orderCta: 'Request information & order',
    orderNote: 'Our team will get back to you within 24 hours.',
    artNr: 'Art.',
    disclaimer:
      'H₂ inhalation devices are wellness products. Not intended to diagnose, treat, cure, or prevent any disease. Individual results may vary. Consult your healthcare provider for medical conditions.',
  },
  de: {
    heroWords: ['Differenzieren.', 'Regenerieren.', 'Skalieren.'],
    heroTagline: 'MOLEKULARER WASSERSTOFF · WISSENSCHAFTLICH FUNDIERT',
    heroSubline: 'Dein H2-Geräteberater.',
    openingQuestion: 'Wie vertraut sind Sie mit molekularem Wasserstoff — oder begegnet Ihnen das Konzept heute zum ersten Mal?',
    openingOptions: ['Ja, ich kenne es gut', 'Ich habe davon gehört', 'Völlig neu für mich'],
    typeYourOwn: 'Oder eigene Antwort eingeben…',
    errorRetry: 'Verbindung konnte nicht aufgebaut werden. Bitte erneut versuchen.',
    retryLabel: 'Erneut versuchen',
    viewRecommendation: 'Empfehlung ansehen →',
    orderCta: 'Informationen & Bestellung anfragen',
    orderNote: 'Unser Team meldet sich innerhalb von 24 Stunden.',
    artNr: 'Art.-Nr.',
    disclaimer:
      'H₂-Inhalationsgeräte sind Wellness-Produkte. Nicht zur Diagnose, Behandlung, Heilung oder Vorbeugung von Krankheiten. Individuelle Ergebnisse können variieren. Bei medizinischen Fragen bitte Ärztin oder Arzt konsultieren.',
  },
  es: {
    heroWords: ['Diferénciate.', 'Recupérate.', 'Escala.'],
    heroTagline: 'HIDRÓGENO MOLECULAR · AVALADO POR LA CIENCIA',
    heroSubline: 'Tu asesor de dispositivos H2.',
    openingQuestion: '¿Estás familiarizado con el hidrógeno molecular, o es la primera vez que te encuentras con este concepto?',
    openingOptions: ['Sí, lo conozco bien', 'He oído hablar de ello', 'Es nuevo para mí'],
    typeYourOwn: 'O escribe tu propia respuesta…',
    errorRetry: 'No se pudo conectar. Inténtalo de nuevo.',
    retryLabel: 'Intentar de nuevo',
    viewRecommendation: 'Ver mi recomendación →',
    orderCta: 'Solicitar información y pedido',
    orderNote: 'Nuestro equipo te responderá en menos de 24 horas.',
    artNr: 'Art.',
    disclaimer:
      'Los dispositivos de inhalación de H₂ son productos de bienestar. No están destinados a diagnosticar, tratar, curar o prevenir enfermedades. Los resultados individuales pueden variar.',
  },
  fr: {
    heroWords: ['Différenciez.', 'Régénérez.', 'Progressez.'],
    heroTagline: 'HYDROGÈNE MOLÉCULAIRE · SOUTENU PAR LA SCIENCE',
    heroSubline: 'Votre conseiller en dispositifs H2.',
    openingQuestion: 'Connaissez-vous déjà l\'hydrogène moléculaire, ou est-ce un concept nouveau pour vous ?',
    openingOptions: ['Oui, je le connais bien', 'J\'en ai entendu parler', 'Tout à fait nouveau pour moi'],
    typeYourOwn: 'Ou saisissez votre propre réponse…',
    errorRetry: 'Connexion impossible. Veuillez réessayer.',
    retryLabel: 'Réessayer',
    viewRecommendation: 'Voir ma recommandation →',
    orderCta: 'Demander des informations et commander',
    orderNote: 'Notre équipe vous répondra dans les 24 heures.',
    artNr: 'Art.',
    disclaimer:
      "Les dispositifs d'inhalation d'H₂ sont des produits de bien-être. Non destinés à diagnostiquer, traiter, guérir ou prévenir une maladie. Les résultats individuels peuvent varier.",
  },
};

export function fmt(template, values) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
}
