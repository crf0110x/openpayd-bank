import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { ethers } from 'ethers';
import * as Clipboard from 'expo-clipboard';

export default function App() {
  const [lang, setLang] = useState('FR');
  const [currency, setCurrency] = useState('EUR');
  
  // États financiers & Blockchain
  const [btcPriceEur, setBtcPriceEur] = useState(68500);
  const [btcPriceUsd, setBtcPriceUsd] = useState(74200);
  const [btcBalance, setBtcBalance] = useState(1.0);
  const targetAddress = '0xa00fAeA51136De3091504AcCD522D0177261eFcc';
  const tokenContract = '0xED341b1e9526FF65dEB1C4E013e0Ffc39aDA8D46';

  // Comptes bancaires enregistrés
  const [accounts, setAccounts] = useState({ EUR: null, USD: null });

  // Contrôle des modales
  const [activeModal, setActiveModal] = useState(null); 
  const [registerCurr, setRegisterCurr] = useState('EUR');
  
  // Formulaire d'enregistrement / d'envoi externe
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formIban, setFormIban] = useState('');
  const [formBic, setFormBic] = useState('');
  const [formMontant, setFormMontant] = useState('');

  // Swap
  const [swapAmount, setSwapAmount] = useState('1');

  useEffect(() => {
    fetchBtcPrice();
    initEthers();
  }, []);

  // Récupération prix BTC CoinGecko
  const fetchBtcPrice = async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur,usd');
      const data = await res.json();
      if (data && data.bitcoin) {
        setBtcPriceEur(data.bitcoin.eur);
        setBtcPriceUsd(data.bitcoin.usd);
      }
    } catch (e) {
      console.log("Erreur API prix BTC");
    }
  };

  // Connexion Ethers.js v6.17.0
  const initEthers = async () => {
    try {
      const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
      const abi = ["function balanceOf(address owner) view returns (uint256)"];
      const contract = new ethers.Contract(tokenContract, abi, provider);
      const rawBalance = await contract.balanceOf(targetAddress);
      const formatted = parseFloat(ethers.formatUnits(rawBalance, 18));
      if (formatted > 0) {
        setBtcBalance(formatted);
      }
    } catch (err) {
      console.log("RPC fallback actif");
    }
  };

  const currentBtcFiatVal = currency === 'EUR' ? btcBalance * btcPriceEur : btcBalance * btcPriceUsd;
  const symbol = currency === 'EUR' ? '€' : '$';

  const handleSaveBank = () => {
    if (!formNom || !formPrenom || !formIban || !formBic) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs du compte bancaire.');
      return;
    }
    setAccounts({
      ...accounts,
      [registerCurr]: { nom: formNom, prenom: formPrenom, bankName: formBankName, iban: formIban, bic: formBic }
    });
    setActiveModal(null);
    clearForm();
    Alert.alert('Succès', `Compte ${registerCurr} enregistré avec succès !`);
  };

  const clearForm = () => {
    setFormNom('');
    setFormPrenom('');
    setFormBankName('');
    setFormIban('');
    setFormBic('');
    setFormMontant('');
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(targetAddress);
    Alert.alert('Copié', 'Adresse BSC copiée dans le presse-papier.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6f9" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* EN-TÊTE */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>O</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>OpenPayd <Text style={{color: '#7c3aed'}}>Bank</Text></Text>
              <Text style={styles.brandSubtitle}>{lang === 'FR' ? 'Banque Crypto & Fiat' : 'Crypto & Fiat Bank'}</Text>
            </View>
          </View>

          <View style={styles.headerControls}>
            <TouchableOpacity onPress={() => setLang(lang === 'FR' ? 'EN' : 'FR')} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>{lang}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')} style={[styles.toggleBtn, styles.activeToggle]} >
              <Text style={[styles.toggleText, {color: '#fff'}]}>{currency}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveModal('settings')} style={styles.iconBtn}>
              <Text>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BANNIÈRE SOLDE TOTAL */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerTitle}>🛡️ {lang === 'FR' ? 'SOLDE TOTAL ESTIMÉ' : 'ESTIMATED TOTAL BALANCE'}</Text>
            <Text style={styles.totalAmount}>
              {symbol}{currentBtcFiatVal.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </Text>
            <View style={styles.rateBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.rateBadgeText}>Compte BNB • {btcBalance.toFixed(4)} BTC</Text>
            </View>
          </View>

          {/* ACTIONS RAPIDES */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard} onPress={() => setActiveModal('send')}>
              <Text style={{fontSize: 18}}>↗️</Text>
              <Text style={styles.actionText}>{lang === 'FR' ? 'Envoyer' : 'Send'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => setActiveModal('receive')}>
              <Text style={{fontSize: 18}}>↙️</Text>
              <Text style={styles.actionText}>{lang === 'FR' ? 'Recevoir' : 'Receive'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => setActiveModal('swap')}>
              <Text style={{fontSize: 18}}>🔄</Text>
              <Text style={styles.actionText}>Swap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => setActiveModal('deposit')}>
              <Text style={{fontSize: 18}}>➕</Text>
              <Text style={styles.actionText}>{lang === 'FR' ? 'Déposer' : 'Deposit'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION COMPTES */}
        <Text style={styles.sectionTitle}>{lang === 'FR' ? 'Comptes Fiat & Crypto' : 'Fiat & Crypto Accounts'}</Text>

        <View style={styles.accountsGrid}>
          
          {/* COMPTE EUR */}
          <View style={[styles.accountCard, {borderColor: '#e11d48'}]}>
            <View>
              <View style={styles.cardHeaderTop}>
                <View style={[styles.currencyIcon, {backgroundColor: '#2563eb'}]}><Text style={{color:'#fff', fontWeight:'bold'}}>€</Text></View>
                <View style={styles.eurTag}><Text style={{color:'#2563eb', fontSize:11, fontWeight:'bold'}}>EUR</Text></View>
              </View>
              <Text style={styles.cardLabel}>Compte Euro (EUR)</Text>
              <Text style={styles.cardSublabel}>SEPA Direct</Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>Solde disponible</Text>
              <Text style={styles.balanceValue}>€0.00</Text>
              {accounts.EUR && (
                <View style={styles.bankBox}>
                  <Text style={{fontWeight:'bold', fontSize:11}}>{accounts.EUR.nom} {accounts.EUR.prenom}</Text>
                  <Text style={{fontSize:10, color:'#64748b'}}>{accounts.EUR.bankName} - {accounts.EUR.iban}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.btnAddAccount} onPress={() => { setRegisterCurr('EUR'); setActiveModal('register-bank'); }}>
                <Text style={{color: '#e11d48', fontWeight: '600', fontSize: 12}}>⊕ Ajouter un compte en EUR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* COMPTE USD */}
          <View style={styles.accountCard}>
            <View>
              <View style={styles.cardHeaderTop}>
                <View style={[styles.currencyIcon, {backgroundColor: '#059669'}]}><Text style={{color:'#fff', fontWeight:'bold'}}>$</Text></View>
                <View style={styles.usdTag}><Text style={{color:'#059669', fontSize:11, fontWeight:'bold'}}>USD</Text></View>
              </View>
              <Text style={styles.cardLabel}>Compte Dollar (USD)</Text>
              <Text style={styles.cardSublabel}>ACH / Wire</Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>Solde disponible</Text>
              <Text style={styles.balanceValue}>$0.00</Text>
              {accounts.USD && (
                <View style={styles.bankBox}>
                  <Text style={{fontWeight:'bold', fontSize:11}}>{accounts.USD.nom} {accounts.USD.prenom}</Text>
                  <Text style={{fontSize:10, color:'#64748b'}}>{accounts.USD.bankName} - {accounts.USD.iban}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.btnAddAccount} onPress={() => { setRegisterCurr('USD'); setActiveModal('register-bank'); }}>
                <Text style={{color: '#e11d48', fontWeight: '600', fontSize: 12}}>⊕ Ajouter un compte en USD</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* COMPTE BTC */}
          <View style={styles.accountCard}>
            <View>
              <View style={styles.cardHeaderTop}>
                <View style={[styles.currencyIcon, {backgroundColor: '#f59e0b'}]}><Text style={{color:'#fff', fontWeight:'bold'}}>₿</Text></View>
                <View style={styles.btcTag}><Text style={{color:'#d97706', fontSize:11, fontWeight:'bold'}}>BNB</Text></View>
              </View>
              <Text style={styles.cardLabel}>Compte BTC (Réseau BNB)</Text>
              <Text style={styles.cardSublabel}>0xa00f...eFcc</Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>Solde BTC Transféré</Text>
              <Text style={styles.balanceValue}>{btcBalance.toFixed(4)} BTC</Text>
              <Text style={{color: '#7c3aed', fontWeight: '600', fontSize: 12, marginTop: 4}}>
                Valeur : {symbol}{currentBtcFiatVal.toLocaleString('fr-FR', {maximumFractionDigits: 2})}
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* --- MODALES --- */}

      {/* 1. ENREGISTRER COMPTE BANCAIRE */}
      <Modal visible={activeModal === 'register-bank'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un compte en {registerCurr}</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{fontSize:18, fontWeight:'bold'}}>✕</Text></TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Nom" value={formNom} onChangeText={setFormNom} />
            <TextInput style={styles.input} placeholder="Prénom" value={formPrenom} onChangeText={setFormPrenom} />
            <TextInput style={styles.input} placeholder="Nom de la banque" value={formBankName} onChangeText={setFormBankName} />
            <TextInput style={styles.input} placeholder="IBAN" value={formIban} onChangeText={setFormIban} />
            <TextInput style={styles.input} placeholder="BIC / SWIFT" value={formBic} onChangeText={setFormBic} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveBank}>
              <Text style={styles.primaryBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. ENVOYER DES FONDS */}
      <Modal visible={activeModal === 'send'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Envoyer des fonds</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{fontSize:18, fontWeight:'bold'}}>✕</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.optionCard} onPress={() => {
              const activeAcc = accounts[currency] || accounts['EUR'] || accounts['USD'];
              if (!activeAcc) {
                setActiveModal('register-bank');
              } else {
                Alert.alert('Compte enregistré', `Redirection vers ${activeAcc.nom} (${activeAcc.iban})`);
              }
            }}>
              <View>
                <Text style={{fontWeight:'bold'}}>Vers mon compte bancaire</Text>
                <Text style={{fontSize:11, color:'#64748b'}}>Accéder aux coordonnées enregistrées</Text>
              </View>
              <Text>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => setActiveModal('send-external')}>
              <View>
                <Text style={{fontWeight:'bold'}}>Vers un compte externe</Text>
                <Text style={{fontSize:11, color:'#64748b'}}>Saisir un autre IBAN bancaire</Text>
              </View>
              <Text>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. SAISIR IBAN EXTERNE */}
      <Modal visible={activeModal === 'send-external'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saisir un autre IBAN bancaire</Text>
              <TouchableOpacity onPress={() => setActiveModal('send')}><Text style={{fontSize:18, fontWeight:'bold'}}>✕</Text></TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Nom du destinataire" value={formNom} onChangeText={setFormNom} />
            <TextInput style={styles.input} placeholder="Prénom du destinataire" value={formPrenom} onChangeText={setFormPrenom} />
            <TextInput style={styles.input} placeholder="Nom de la banque" value={formBankName} onChangeText={setFormBankName} />
            <TextInput style={styles.input} placeholder="IBAN" value={formIban} onChangeText={setFormIban} />
            <TextInput style={styles.input} placeholder="BIC / SWIFT" value={formBic} onChangeText={setFormBic} />
            <TextInput style={styles.input} placeholder="Montant" keyboardType="numeric" value={formMontant} onChangeText={setFormMontant} />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { Alert.alert('Succès', 'Virement externe exécuté.'); setActiveModal(null); }}>
              <Text style={styles.primaryBtnText}>Confirmer l'envoi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. RECEVOIR */}
      <Modal visible={activeModal === 'receive'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recevoir des fonds</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{fontSize:18, fontWeight:'bold'}}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{fontSize:12, color:'#64748b', marginBottom:10}}>Votre adresse BNB Smart Chain :</Text>
            <View style={{backgroundColor:'#f1f5f9', padding:10, borderRadius:8, marginBottom:15}}>
              <Text style={{fontFamily:'monospace', fontSize:12}}>{targetAddress}</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={copyToClipboard}>
              <Text style={styles.primaryBtnText}>Copier l'adresse</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5. DÉPOSER */}
      <Modal visible={activeModal === 'deposit'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Déposer des fonds</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{fontSize:18, fontWeight:'bold'}}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{fontSize:13, color:'#64748b', marginBottom:15}}>Sélectionnez le mode de dépôt pour obtenir votre IBAN personnalisé ou instruction de dépôt.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { Alert.alert('Confirmé', 'Votre demande est enregistrée.'); setActiveModal(null); }}>
              <Text style={styles.primaryBtnText}>Générer les instructions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 6. SWAP */}
      <Modal visible={activeModal === 'swap'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Swap Crypto / Fiat</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{fontSize:18, fontWeight:'bold'}}>✕</Text></TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Montant BTC" keyboardType="numeric" value={swapAmount} onChangeText={setSwapAmount} />
            <View style={{backgroundColor:'#f8fafc', padding:12, borderRadius:8, marginBottom:15}}>
              <Text style={{fontSize:12, color:'#64748b'}}>Montant estimé reçu :</Text>
              <Text style={{fontSize:18, fontWeight:'bold', color:'#7c3aed'}}>
                {symbol}{(parseFloat(swapAmount || 0) * (currency === 'EUR' ? btcPriceEur : btcPriceUsd)).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { Alert.alert('Succès', 'Swap effectué !'); setActiveModal(null); }}>
              <Text style={styles.primaryBtnText}>Exécuter le Swap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 7. PARAMÈTRES */}
      <Modal visible={activeModal === 'settings'} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paramètres & Support</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={{fontSize:18, fontWeight:'bold'}}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{fontSize:13, marginBottom:10}}>Support Client : <Text style={{fontWeight:'bold'}}>support@openpaydirect.org</Text></Text>
            <Text style={{fontSize:13, marginBottom:15}}>Réseau : Binance Smart Chain (BSC)</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.primaryBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: { width: 38, height: 38, backgroundColor: '#7c3aed', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  brandIconText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  brandTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  brandSubtitle: { fontSize: 11, color: '#64748b' },
  headerControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  activeToggle: { backgroundColor: '#7c3aed' },
  toggleText: { fontSize: 12, fontWeight: '600' },
  iconBtn: { width: 32, height: 32, backgroundColor: '#f1f5f9', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  banner: { backgroundColor: '#7c3aed', borderRadius: 20, padding: 20, marginBottom: 20 },
  bannerTitle: { color: '#fff', fontSize: 11, fontWeight: '700', opacity: 0.9, marginBottom: 6 },
  totalAmount: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 10 },
  rateBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6 },
  greenDot: { width: 6, height: 6, backgroundColor: '#10b981', borderRadius: 3 },
  rateBadgeText: { color: '#fff', fontSize: 11 },
  
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  actionCard: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 10, alignItems: 'center', flex: 1, marginHorizontal: 3 },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 4 },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#1e293b' },
  accountsGrid: { gap: 12 },
  accountCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: 'transparent', justifyContent: 'space-between', minHeight: 180 },
  cardHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currencyIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  eurTag: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  usdTag: { backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  btcTag: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  cardLabel: { fontSize: 14, fontWeight: '700', marginTop: 10 },
  cardSublabel: { fontSize: 11, color: '#64748b' },
  balanceLabel: { fontSize: 11, color: '#64748b', marginTop: 10 },
  balanceValue: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  bankBox: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, marginTop: 6 },
  btnAddAccount: { marginTop: 10, backgroundColor: '#fff1f2', padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#e11d48' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, fontSize: 13, marginBottom: 10 },
  primaryBtn: { backgroundColor: '#7c3aed', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  optionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 12, marginBottom: 10 }
});