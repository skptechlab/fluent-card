// <!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8" />
// <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
// <title>$MASQ Buy Pack</title>
// <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
// <link rel="stylesheet" href="styles.css" />
// <style>
//   body { background: #000; color: #FFF; font-family: 'Roboto', sans-serif; display: flex; flex-direction: column; align-items: center; }
//   #status, #balance, #ownedSets, #userInfo { margin: 10px 0; }
//   .hidden { display: none; }
// </style>
// </head>
// <body>
// <h2>Buy Your $MASQ Pack</h2>
// <button id="connectWalletBtn">Connect Wallet</button>
// <p id="status"></p>
// <p id="balance"></p>
// <p id="ownedSets"></p>
// <div id="userInfo"></div>
// <button id="buyPackBtn" class="hidden">Buy Pack</button>
// <div id="loadingSpinner" class="hidden">Loading...</div>

// <script type="module">
// import {
//   getAssociatedTokenAddress,
//   createAssociatedTokenAccountInstruction,
//   createTransferInstruction,
//   TOKEN_PROGRAM_ID,
//   ASSOCIATED_TOKEN_PROGRAM_ID
// } from "https://esm.sh/@solana/spl-token@0.3.5";

// const masqMintAddress = '68o1DHL3XoEESBmMU1a1qQwe5BMAV2HFVPCCb5qmpump';
// const treasuryPublicKey = new solanaWeb3.PublicKey('GANrTbdEBQqMGdNRen1XQAC2CZtzZwhovc68KH8Bzaga');

// let heliusUrl = "";
// let provider = null;
// let userPublicKey = null;
// let supabase = null;

// async function initSupabase() {
//   if (!supabase) {
//     const response = await fetch('/api/supabaseKeys');
//     const { SUPABASE_URL, SUPABASE_ANON_KEY } = await response.json();
//     const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
//     supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
//     console.log("Supabase initialized!");
//   }
// }

// async function getHeliusUrl() {
//   showLoadingSpinner(true);
//   try {
//     const response = await fetch('/api/helius-key');
//     if (!response.ok) throw new Error('Failed to fetch Helius key.');
//     const { heliusKey } = await response.json();
//     heliusUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
//   } catch (err) {
//     console.error("Error fetching Helius key:", err);
//     alert("Could not initialize wallet connection. Please try again later.");
//   } finally {
//     showLoadingSpinner(false);
//   }
// }

// function showLoadingSpinner(show = true) {
//   document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
// }

// await getHeliusUrl();
// await initSupabase();

// document.getElementById('connectWalletBtn').onclick = async () => {
//   showLoadingSpinner(true);
//   if ('solana' in window) {
//     provider = window.solana;
//     try {
//       const resp = await provider.connect();
//       userPublicKey = resp.publicKey;
//       document.getElementById('status').textContent = `Connected Wallet: ${userPublicKey.toBase58()}`;

//       const connection = new solanaWeb3.Connection(heliusUrl);
//       const masqMint = new solanaWeb3.PublicKey(masqMintAddress);

//       const tokenAccounts = await connection.getTokenAccountsByOwner(userPublicKey, { mint: masqMint });
//       let balance = 0;
//       if (tokenAccounts.value.length > 0) {
//         const tokenAccountPubkey = tokenAccounts.value[0].pubkey;
//         const tokenAccountInfo = await connection.getParsedAccountInfo(tokenAccountPubkey);
//         balance = tokenAccountInfo.value.data.parsed.info.tokenAmount.uiAmount;
//       }

//       document.getElementById('balance').textContent = `$MASQ Balance: ${balance}`;
//       if (balance >= 1_000) {
//         document.getElementById('buyPackBtn').style.display = 'inline-block';
//       }

//       const { data: user, error: userError } = await supabase.auth.getUser();
//       if (userError || !user?.user) {
//         document.getElementById('ownedSets').textContent = 'Sets owned: Guest mode';
//         return;
//       }

//       const userId = user.user.id;
//       const { data: profile } = await supabase.from('users').select('username, owned_sets, wallet').eq('id', userId).single();
//       const ownedSets = profile?.owned_sets || [];
//       const username = profile?.username || 'Not set';
//       const linkedWallet = profile?.wallet || 'None linked';

//       const setNames = ownedSets.map(setId => setId === 1 ? "Default Set" : setId === 2 ? "Golden Set" : `Set #${setId}`);
//       document.getElementById('ownedSets').textContent = `Sets owned: ${setNames.join(', ') || 'None'}`;
//       document.getElementById('userInfo').innerHTML = `
//         <p><strong>Username:</strong> ${username}</p>
//         <p><strong>Linked Wallet:</strong> ${linkedWallet}</p>
//       `;
//     } catch (err) {
//       console.error("Error connecting to wallet:", err);
//       alert('Failed to connect wallet.');
//     } finally {
//       showLoadingSpinner(false);
//     }
//   } else {
//     alert('Phantom wallet not found. Please install it.');
//   }
// };

// document.getElementById('buyPackBtn').onclick = async () => {
//   showLoadingSpinner(true);
//   if (!provider || !userPublicKey) {
//     alert('Please connect your wallet first!');
//     showLoadingSpinner(false);
//     return;
//   }

//   const connection = new solanaWeb3.Connection(heliusUrl);
//   const masqMint = new solanaWeb3.PublicKey(masqMintAddress);

//   const { data: user } = await supabase.auth.getUser();
//   if (!user?.user) {
//     alert('User not authenticated.');
//     showLoadingSpinner(false);
//     return;
//   }

//   const userId = user.user.id;
//   const { data: profile } = await supabase.from('users').select('owned_sets, wallet').eq('id', userId).single();
//   const ownedSets = profile?.owned_sets || [];
//   const walletInDB = profile?.wallet;
//   const connectedWallet = userPublicKey.toBase58();

//   if (walletInDB && walletInDB !== connectedWallet) {
//     alert("This wallet does not match your linked wallet. Contact support to update it.");
//     showLoadingSpinner(false);
//     return;
//   } else if (!walletInDB) {
//     const confirmLink = confirm("Link this wallet to your account? This cannot be changed later!");
//     if (confirmLink) {
//       await supabase.from('users').update({
//         owned_sets: ownedSets.includes(2) ? ownedSets : [...ownedSets, 2],
//         wallet: connectedWallet
//       }).eq('id', userId);
//       document.getElementById('ownedSets').textContent = `Sets owned: ${[...ownedSets, 2].join(', ')}`;
//     } else {
//       alert("Wallet not linked. Purchase cancelled.");
//       showLoadingSpinner(false);
//       return;
//     }
//   }

//   // Transaction
//   const userTokenAccount = await getAssociatedTokenAddress(masqMint, userPublicKey, false);
//   const treasuryTokenAccount = await getAssociatedTokenAddress(masqMint, treasuryPublicKey, true);

//   const instructions = [];
//   const userATAInfo = await connection.getAccountInfo(userTokenAccount);
//   if (!userATAInfo) {
//     instructions.push(
//       createAssociatedTokenAccountInstruction(userPublicKey, userTokenAccount, userPublicKey, masqMint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID)
//     );
//   }
//   const treasuryATAInfo = await connection.getAccountInfo(treasuryTokenAccount);
//   if (!treasuryATAInfo) {
//     instructions.push(
//       createAssociatedTokenAccountInstruction(userPublicKey, treasuryTokenAccount, treasuryPublicKey, masqMint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID)
//     );
//   }

//   const amountToTransfer = 100000000_000;
//   const transferIx = createTransferInstruction(userTokenAccount, treasuryTokenAccount, userPublicKey, amountToTransfer, [], TOKEN_PROGRAM_ID);
//   instructions.push(transferIx);

//   const transaction = new solanaWeb3.Transaction().add(...instructions);
//   transaction.feePayer = userPublicKey;
//   const { blockhash } = await connection.getLatestBlockhash();
//   transaction.recentBlockhash = blockhash;

//   try {
//     const signedTx = await provider.signTransaction(transaction);
//     const signature = await connection.sendRawTransaction(signedTx.serialize());
//     await connection.confirmTransaction(signature, 'confirmed');
//     alert(`Pack purchased successfully! Tx: ${signature}`);
//   } catch (err) {
//     console.error("Transaction error:", err);
//     alert('Transaction failed. Check console for logs.');
//   } finally {
//     showLoadingSpinner(false);
//   }
// };
// </script>
// </body>
// </html>


<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>$MASQ Buy Pack</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css" />
<style>
  body { background: #000; color: #FFF; font-family: 'Roboto', sans-serif; display: flex; flex-direction: column; align-items: center; }
  #status, #balance, #ownedSets, #userInfo { margin: 10px 0; }
  .hidden { display: none; }
</style>
</head>
<body>
<h2>Buy Your $MASQ Pack</h2>
<button id="connectWalletBtn">Connect Wallet</button>
<p id="status"></p>
<p id="balance"></p>
<p id="ownedSets"></p>
<div id="userInfo"></div>
<button id="buyPackBtn" class="hidden">Buy Pack</button>
<div id="loadingSpinner" class="hidden">Loading...</div>

<script type="module">
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "https://esm.sh/@solana/spl-token@0.3.5";

const masqMintAddress = '68o1DHL3XoEESBmMU1a1qQwe5BMAV2HFVPCCb5qmpump';
const treasuryPublicKey = new solanaWeb3.PublicKey('GANrTbdEBQqMGdNRen1XQAC2CZtzZwhovc68KH8Bzaga');

let heliusUrl = "";
let provider = null;
let userPublicKey = null;
let supabase = null;

async function initSupabase() {
  if (!supabase) {
    const response = await fetch('/api/supabaseKeys');
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = await response.json();
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase initialized!");
  }
}

async function getHeliusUrl() {
  showLoadingSpinner(true);
  try {
    const response = await fetch('/api/helius-key');
    if (!response.ok) throw new Error('Failed to fetch Helius key.');
    const { heliusKey } = await response.json();
    heliusUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  } catch (err) {
    console.error("Error fetching Helius key:", err);
    alert("Could not initialize wallet connection. Please try again later.");
  } finally {
    showLoadingSpinner(false);
  }
}

function showLoadingSpinner(show = true) {
  document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

await getHeliusUrl();
await initSupabase();

document.getElementById('connectWalletBtn').onclick = async () => {
  showLoadingSpinner(true);
  if ('solana' in window) {
    provider = window.solana;
    try {
      const resp = await provider.connect();
      userPublicKey = resp.publicKey;
      document.getElementById('status').textContent = `Connected Wallet: ${userPublicKey.toBase58()}`;

      const connection = new solanaWeb3.Connection(heliusUrl);
      const masqMint = new solanaWeb3.PublicKey(masqMintAddress);

      const tokenAccounts = await connection.getTokenAccountsByOwner(userPublicKey, { mint: masqMint });
      let balance = 0;
      if (tokenAccounts.value.length > 0) {
        const tokenAccountPubkey = tokenAccounts.value[0].pubkey;
        const tokenAccountInfo = await connection.getParsedAccountInfo(tokenAccountPubkey);
        balance = tokenAccountInfo.value.data.parsed.info.tokenAmount.uiAmount;
      }

      document.getElementById('balance').textContent = `$MASQ Balance: ${balance}`;
      if (balance >= 1_000) {
        document.getElementById('buyPackBtn').style.display = 'inline-block';
      }

      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user) {
        document.getElementById('ownedSets').textContent = 'Sets owned: Guest mode';
        return;
      }

      const userId = user.user.id;
      const { data: profile } = await supabase.from('users').select('username, owned_sets, wallet').eq('id', userId).single();
      const ownedSets = profile?.owned_sets || [];
      const username = profile?.username || 'Not set';
      const linkedWallet = profile?.wallet || 'None linked';

      const setNames = ownedSets.map(setId => setId === 1 ? "Default Set" : setId === 2 ? "Golden Set" : `Set #${setId}`);
      document.getElementById('ownedSets').textContent = `Sets owned: ${setNames.join(', ') || 'None'}`;
      document.getElementById('userInfo').innerHTML = `
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Linked Wallet:</strong> ${linkedWallet}</p>
      `;
    } catch (err) {
      console.error("Error connecting to wallet:", err);
      alert('Failed to connect wallet.');
    } finally {
      showLoadingSpinner(false);
    }
  } else {
    alert('Phantom wallet not found. Please install it.');
  }
};

document.getElementById('buyPackBtn').onclick = async () => {
  showLoadingSpinner(true);
  if (!provider || !userPublicKey) {
    alert('Please connect your wallet first!');
    showLoadingSpinner(false);
    return;
  }

  const connection = new solanaWeb3.Connection(heliusUrl);
  const masqMint = new solanaWeb3.PublicKey(masqMintAddress);

  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) {
    alert('User not authenticated.');
    showLoadingSpinner(false);
    return;
  }

  const userId = user.user.id;
  const { data: profile } = await supabase.from('users').select('owned_sets, wallet').eq('id', userId).single();
  const ownedSets = profile?.owned_sets || [];
  const walletInDB = profile?.wallet;
  const connectedWallet = userPublicKey.toBase58();

  if (walletInDB && walletInDB !== connectedWallet) {
    alert("This wallet does not match your linked wallet. Contact support to update it.");
    showLoadingSpinner(false);
    return;
  } else if (!walletInDB) {
    const confirmLink = confirm("Link this wallet to your account? This cannot be changed later!");
    if (confirmLink) {
      await supabase.from('users').update({
        owned_sets: ownedSets.includes(2) ? ownedSets : [...ownedSets, 2],
        wallet: connectedWallet
      }).eq('id', userId);
      document.getElementById('ownedSets').textContent = `Sets owned: ${[...ownedSets, 2].join(', ')}`;
    } else {
      alert("Wallet not linked. Purchase cancelled.");
      showLoadingSpinner(false);
      return;
    }
  }

  // Transaction
  const userTokenAccount = await getAssociatedTokenAddress(masqMint, userPublicKey, false);
  const treasuryTokenAccount = await getAssociatedTokenAddress(masqMint, treasuryPublicKey, true);

  const instructions = [];
  const userATAInfo = await connection.getAccountInfo(userTokenAccount);
  if (!userATAInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(userPublicKey, userTokenAccount, userPublicKey, masqMint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID)
    );
  }
  const treasuryATAInfo = await connection.getAccountInfo(treasuryTokenAccount);
  if (!treasuryATAInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(userPublicKey, treasuryTokenAccount, treasuryPublicKey, masqMint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID)
    );
  }

  const amountToTransfer = 100000000_000;
  const transferIx = createTransferInstruction(userTokenAccount, treasuryTokenAccount, userPublicKey, amountToTransfer, [], TOKEN_PROGRAM_ID);
  instructions.push(transferIx);

  const transaction = new solanaWeb3.Transaction().add(...instructions);
  transaction.feePayer = userPublicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  try {
  const signedTx = await provider.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(signature, 'confirmed');
  alert(`Pack purchased successfully! Tx: ${signature}`);

  // 🟩 After transaction, double-check & update owned_sets to include 2
  const { data: updatedProfile, error: fetchError } = await supabase
    .from('users')
    .select('owned_sets')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error("Error fetching profile after tx:", fetchError);
  } else {
    const ownedSetsAfter = updatedProfile.owned_sets || [];
    if (!ownedSetsAfter.includes(2)) {
      const updatedSets = [...ownedSetsAfter, 2];
      const { error: updateError } = await supabase
        .from('users')
        .update({ owned_sets: updatedSets })
        .eq('id', userId);

      if (updateError) {
        console.error("Error updating owned_sets:", updateError);
      } else {
        document.getElementById('ownedSets').textContent = `Sets owned: ${updatedSets.join(', ')}`;
        console.log("owned_sets updated to include 2 after purchase.");
      }
    } else {
      console.log("User already has 2 in owned_sets, no update needed.");
    }
  }
} catch (err) {
  console.error("Transaction error:", err);
  alert('Transaction failed. Check console for logs.');
} finally {
  showLoadingSpinner(false);
}
};

</script>
</body>
</html>

