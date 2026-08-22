import { AppUser } from '../types';

/**
 * Returns 'Admin' for admin roles, or 'Agent' for staff/agent roles.
 */
export function getRoleLabel(role?: string): string {
  if (role === 'admin' || role === 'Admin' || role === 'Administrateur') {
    return 'Admin';
  }
  return 'Agent';
}

/**
 * Formats a role and full name into the standard operator identity string: "Role — Full Name"
 * Example: "Admin — Yassine El Amrani" or "Agent — Mohamed Alaoui"
 */
export function formatOperatorIdentity(role?: string, fullName?: string): string {
  if (!fullName || !fullName.trim() || fullName === 'Utilisateur' || fullName === 'Opérateur') {
    return 'Opérateur';
  }
  const cleanName = fullName.trim();
  
  // If cleanName already starts with "Admin — ", "Agent — ", or "Administrateur — ", return as is
  if (cleanName.startsWith('Admin — ') || cleanName.startsWith('Agent — ') || cleanName.startsWith('Administrateur — ')) {
    return cleanName;
  }
  
  const roleLabel = getRoleLabel(role);
  return `${roleLabel} — ${cleanName}`;
}

/**
 * Normalise et formate le nom de l'opérateur pour l'affichage à l'écran et dans les exports PDF.
 * Si le champ contient un nom brut ou un ID, la fonction applique le rôle AFY et le nom complet.
 */
export function formatOperatorName(
  rawOperator?: string | null,
  users?: AppUser[] | Record<string, AppUser> | null,
  defaultFallback: string = 'Opérateur'
): string {
  if (!rawOperator || rawOperator.trim() === '') {
    if (defaultFallback && defaultFallback !== 'Opérateur' && defaultFallback !== 'Opérateur AFY' && defaultFallback !== 'Utilisateur' && defaultFallback.trim().length > 0) {
      return formatOperatorName(defaultFallback, users);
    }
    if (users) {
      const userList = Array.isArray(users) ? users : Object.values(users);
      const validUser = userList.find(u => u.name && u.name.trim().length > 0 && u.name !== 'Utilisateur' && u.name !== 'Opérateur');
      if (validUser) {
        return formatOperatorIdentity(validUser.role, validUser.name);
      }
    }
    return defaultFallback;
  }

  const trimmed = rawOperator.trim();

  // Si déjà sous le format "Role — Nom complet"
  if (trimmed.startsWith('Admin — ') || trimmed.startsWith('Agent — ') || trimmed.startsWith('Administrateur — ')) {
    return trimmed;
  }

  const userList = users ? (Array.isArray(users) ? users : Object.values(users)) : [];

  // 1. Recherche directe dans la liste des utilisateurs par ID, Email ou Nom
  if (userList.length > 0) {
    const foundUser = userList.find(u => 
      u.id === trimmed || 
      (u.email && u.email.toLowerCase() === trimmed.toLowerCase()) ||
      (u.name && u.name.toLowerCase() === trimmed.toLowerCase()) ||
      (u.name && trimmed.toLowerCase().includes(u.name.toLowerCase()))
    );

    if (foundUser && foundUser.name && foundUser.name.trim().length > 0 && foundUser.name !== 'Utilisateur') {
      return formatOperatorIdentity(foundUser.role, foundUser.name);
    }
  }

  // 2. Si c'est une adresse email
  if (trimmed.includes('@')) {
    const formattedFromEmail = formatEmailToName(trimmed);
    return formatOperatorIdentity('staff', formattedFromEmail);
  }

  // 3. Mots génériques ("Opérateur", "Utilisateur", "anonymous")
  const isGeneric = ['operator', 'opérateur', 'opérateur afy', 'utilisateur', 'anonymous', 'undefined', 'null'].includes(trimmed.toLowerCase());
  if (isGeneric) {
    if (defaultFallback && defaultFallback !== 'Opérateur' && defaultFallback !== 'Opérateur AFY' && defaultFallback !== 'Utilisateur' && defaultFallback.trim().length > 0) {
      return formatOperatorName(defaultFallback, users);
    }
    if (userList.length > 0) {
      const validUser = userList.find(u => u.name && u.name.trim().length > 0 && u.name !== 'Utilisateur' && u.name !== 'Opérateur');
      if (validUser) {
        return formatOperatorIdentity(validUser.role, validUser.name);
      }
    }
    return defaultFallback;
  }

  // 4. Si c'est un nom brut sans préfixe de rôle (ex: "Mohamed Alaoui" ou "Yassine El Amrani")
  if (!isFirebaseUid(trimmed)) {
    return formatOperatorIdentity('staff', trimmed);
  }

  // 5. Fallback si UID Firebase inconnu
  if (defaultFallback && defaultFallback !== 'Opérateur' && defaultFallback !== 'Opérateur AFY' && defaultFallback !== 'Utilisateur') {
    return formatOperatorName(defaultFallback, users);
  }

  return defaultFallback;
}

/**
 * Détecte si une chaîne ressemble à un UID Firebase brut (ex: LuzQThKONUdg8dKUYRb12fyxMXx2)
 */
export function isFirebaseUid(str: string): boolean {
  if (!str) return false;
  const s = str.trim();
  const isAlphaNumOnly = /^[a-zA-Z0-9_-]{20,36}$/.test(s);
  const hasMixedCaseOrDigits = (/[A-Z]/.test(s) && /[a-z]/.test(s)) || (/[a-zA-Z]/.test(s) && /[0-9]/.test(s));
  return isAlphaNumOnly && hasMixedCaseOrDigits && !s.includes(' ');
}

/**
 * Convertit un email en nom lisible (ex: "yassine.elamrani@gmail.com" -> "Yassine Elamrani")
 */
export function formatEmailToName(email: string): string {
  if (!email || !email.includes('@')) return email;
  const prefix = email.split('@')[0];
  const cleaned = prefix.replace(/[0-9]+$/g, '').replace(/[._-]/g, ' ').trim();
  
  if (cleaned.length < 2) {
    return email;
  }

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
