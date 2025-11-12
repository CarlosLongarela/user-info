/**
 * System Diagnostics Script
 * Collects system information and sends it via email
 */

const cl_diagnostics = {
	/**
	 * Initialize the diagnostics
	 */
	init: function() {
		this.initTheme();
		this.gatherSystemInfo();
		this.setupEventListeners();
	},

	/**
	 * Initialize theme from localStorage
	 */
	initTheme: function() {
		const savedTheme = localStorage.getItem( 'theme' ) || 'light';
		document.documentElement.setAttribute( 'data-theme', savedTheme );
		this.updateThemeIcon( savedTheme );
	},

	/**
	 * Toggle theme between light and dark
	 */
	toggleTheme: function() {
		const currentTheme = document.documentElement.getAttribute( 'data-theme' );
		const newTheme     = currentTheme === 'dark' ? 'light' : 'dark';

		document.documentElement.setAttribute( 'data-theme', newTheme );
		localStorage.setItem( 'theme', newTheme );
		this.updateThemeIcon( newTheme );
	},

	/**
	 * Update theme toggle button icon
	 */
	updateThemeIcon: function( theme ) {
		const icon = document.querySelector( '.theme-icon' );
		icon.textContent = theme === 'dark' ? '☀️' : '🌙';
	},

	/**
	 * Gather all system information
	 */
	gatherSystemInfo: async function() {
		const systemInfo = {
			browser:  this.getBrowserInfo(),
			system:   this.getSystemInfo(),
			screen:   this.getScreenInfo(),
			network:  await this.getNetworkInfo(),
			features: this.getFeatures()
		};

		this.displayInfo( systemInfo );
		this.systemData = systemInfo;
		this.updateTextarea();
	},

	/**
	 * Get browser information
	 */
	getBrowserInfo: function() {
		const ua = navigator.userAgent;
		const browserInfo = {
			userAgent:      ua,
			language:       navigator.language,
			languages:      navigator.languages ? navigator.languages.join( ', ' ) : navigator.language,
			cookiesEnabled: navigator.cookieEnabled,
			onLine:         navigator.onLine,
			doNotTrack:     navigator.doNotTrack || 'Not specified'
		};

		// Detect browser name and version
		let browserName    = 'Unknown';
		let browserVersion = 'Unknown';

		if ( ua.includes( 'Chrome' ) && !ua.includes( 'Edg' ) && !ua.includes( 'OPR' ) ) {
			browserName       = 'Chrome';
			const chromeMatch = /Chrome\/(\d+)/.exec( ua );
			browserVersion    = chromeMatch?.[1] || 'Unknown';
		} else if ( ua.includes( 'Safari' ) && !ua.includes( 'Chrome' ) ) {
			browserName       = 'Safari';
			const safariMatch = /Version\/(\d+)/.exec( ua );
			browserVersion    = safariMatch?.[1] || 'Unknown';
		} else if ( ua.includes( 'Firefox' ) ) {
			browserName        = 'Firefox';
			const firefoxMatch = /Firefox\/(\d+)/.exec( ua );
			browserVersion     = firefoxMatch?.[1] || 'Unknown';
		} else if ( ua.includes( 'Edg' ) ) {
			browserName     = 'Edge';
			const edgeMatch = /Edg\/(\d+)/.exec( ua );
			browserVersion  = edgeMatch?.[1] || 'Unknown';
		} else if ( ua.includes( 'OPR' ) || ua.includes( 'Opera' ) ) {
			browserName       = 'Opera';
			const operaMatch = /(?:OPR|Opera)[\/\s](\d+)/.exec( ua );
			browserVersion    = operaMatch?.[1] || 'Unknown';
		}

		browserInfo.name    = browserName;
		browserInfo.version = browserVersion;

		return browserInfo;
	},

	/**
	 * Get system information
	 */
	getSystemInfo: function() {
		const ua = navigator.userAgent;
		let os   = 'Unknown';
		let platform = 'Unknown';

		if ( ua.includes( 'Win' ) ) {
			if ( ua.includes( 'Windows NT 10.0' ) || ua.includes( 'Windows NT 11.0' ) ) {
				os = 'Windows 10/11';
			} else {
				os = 'Windows';
			}
			platform = 'Windows';
		} else if ( ua.includes( 'Mac' ) ) {
			os = 'macOS';
			platform = 'macOS';
		} else if ( ua.includes( 'Linux' ) ) {
			os = 'Linux';
			platform = 'Linux';
		} else if ( ua.includes( 'Android' ) ) {
			os = 'Android';
			platform = 'Android';
		} else if ( ua.includes( 'iOS' ) || ua.includes( 'iPhone' ) || ua.includes( 'iPad' ) || ua.includes( 'iPod' ) ) {
			os = 'iOS';
			platform = 'iOS';
		}

		// Use userAgentData if available (modern browsers)
		if ( navigator.userAgentData?.platform ) {
			platform = navigator.userAgentData.platform;
		}

		// Format memory with note if at maximum
		let memoryText = 'Unknown';
		if ( navigator.deviceMemory ) {
			memoryText = navigator.deviceMemory + ' GB';
			if ( navigator.deviceMemory >= 8 ) {
				memoryText += ' (aprox. Se mostrará un máximo de 8 GB)';
			}
		}

		return {
			platform: platform,
			os: os,
			mobile: /Mobile|Android|iOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
			cores:  navigator.hardwareConcurrency || 'Unknown',
			memory: memoryText
		};
	},

	/**
	 * Get screen information
	 */
	getScreenInfo: function() {
		return {
			resolution:          `${screen.width} x ${screen.height}`,
			availableResolution: `${screen.availWidth} x ${screen.availHeight}`,
			colorDepth:          screen.colorDepth + ' bits',
			pixelRatio:          window.devicePixelRatio || 1,
			viewport:            `${window.innerWidth} x ${window.innerHeight}`,
			orientation:         screen.orientation ? screen.orientation.type : 'Unknown'
		};
	},

	/**
	 * Get network information
	 */
	getNetworkInfo: async function() {
		const info = {
			connection: 'Unknown',
			effectiveType: 'Unknown',
			downlink: 'Unknown',
			rtt: 'Unknown'
		};

		// Get connection info if available
		if ( navigator.connection ) {
			info.connection    = navigator.connection.type || 'Unknown';
			info.effectiveType = navigator.connection.effectiveType || 'Unknown';
			info.downlink      = navigator.connection.downlink ? navigator.connection.downlink + ' Mbps' : 'Unknown';
			info.rtt           = navigator.connection.rtt ? navigator.connection.rtt + ' ms' : 'Unknown';
		}

		// Get IP info from external service
		try {
			// Use geojs.io (free, reliable, works from browser)
			const response = await fetch( 'https://get.geojs.io/v1/ip/geo.json' );
			const data     = await response.json();

			info.ip        = data.ip || 'Unknown';
			info.city      = data.city || 'Unknown';
			info.region    = data.region || 'Unknown';
			info.country   = data.country || 'Unknown';
			info.isp       = data.organization_name || 'Unknown';
			info.timezone  = data.timezone || 'Unknown';
		} catch ( error ) {
			console.error( 'Error fetching IP info:', error );
			// Fallback to ipify for at least getting the IP
			try {
				const ipResponse = await fetch( 'https://api.ipify.org?format=json' );
				const ipData     = await ipResponse.json();
				info.ip = ipData.ip || 'Unknown';
			} catch ( ipError ) {
				console.error( 'Error fetching IP from fallback:', ipError );
			}
		}

		return info;
	},

	/**
	 * Get browser features
	 */
	getFeatures: function() {
		return {
			webGL:          this.checkWebGL(),
			webRTC:         typeof RTCPeerConnection !== 'undefined',
			localStorage:   typeof localStorage      !== 'undefined',
			sessionStorage: typeof sessionStorage    !== 'undefined',
			indexedDB:      typeof indexedDB         !== 'undefined',
			serviceWorker: 'serviceWorker' in navigator,
			notifications: 'Notification' in globalThis,
			geolocation:   'geolocation' in navigator,
			battery:       'getBattery' in navigator,
			webAudio:      typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
			webAssembly:   typeof WebAssembly  !== 'undefined'
		};
	},

	/**
	 * Check WebGL support
	 */
	checkWebGL: function() {
		try {
			const canvas = document.createElement( 'canvas' );
			return !! ( globalThis.WebGLRenderingContext &&
					 ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );
		} catch( e ) {
			console.error( 'Error checking WebGL support:', e );
			return false;
		}
	},

	/**
	 * Display information on the page
	 */
	displayInfo: function( info ) {
		// Browser info.
		const browserHtml = `
			<p><strong>Navegador:</strong> ${info.browser.name} ${info.browser.version}</p>
			<p><strong>User Agent:</strong> ${info.browser.userAgent}</p>
			<p><strong>Idioma:</strong> ${info.browser.language}</p>
			<p><strong>Idiomas disponibles:</strong> ${info.browser.languages}</p>
			<p><strong>Cookies habilitadas:</strong> ${info.browser.cookiesEnabled ? 'Sí' : 'No'}</p>
			<p><strong>En línea:</strong> ${info.browser.onLine ? 'Sí' : 'No'}</p>
			<p><strong>Do Not Track:</strong> ${info.browser.doNotTrack}</p>
		`;
		document.getElementById('browser-info').innerHTML = browserHtml;

		// System info.
		const systemHtml = `
			<p><strong>Sistema operativo:</strong> ${info.system.os}</p>
			<p><strong>Plataforma:</strong> ${info.system.platform}</p>
			<p><strong>Dispositivo móvil:</strong> ${info.system.mobile ? 'Sí' : 'No'}</p>
			<p><strong>Núcleos CPU:</strong> ${info.system.cores}</p>
			<p><strong>Memoria:</strong> ${info.system.memory}</p>
		`;
		document.getElementById('system-info').innerHTML = systemHtml;

		// Screen info.
		const screenHtml = `
			<p><strong>Resolución:</strong> ${info.screen.resolution}</p>
			<p><strong>Resolución disponible:</strong> ${info.screen.availableResolution}</p>
			<p><strong>Viewport:</strong> ${info.screen.viewport}</p>
			<p><strong>Profundidad de color:</strong> ${info.screen.colorDepth}</p>
			<p><strong>Pixel Ratio:</strong> ${info.screen.pixelRatio}</p>
			<p><strong>Orientación:</strong> ${info.screen.orientation}</p>
		`;
		document.getElementById('screen-info').innerHTML = screenHtml;

		// Network info.
		const networkHtml = `
			<p><strong>IP:</strong> ${info.network.ip}</p>
			<p><strong>ISP:</strong> ${info.network.isp}</p>
			<p><strong>Ciudad:</strong> ${info.network.city}</p>
			<p><strong>Región:</strong> ${info.network.region}</p>
			<p><strong>País:</strong> ${info.network.country}</p>
			<p><strong>Zona horaria:</strong> ${info.network.timezone}</p>
			<p><strong>Tipo de conexión:</strong> ${info.network.connection}</p>
			<p><strong>Tipo efectivo:</strong> ${info.network.effectiveType}</p>
			<p><strong>Velocidad bajada:</strong> ${info.network.downlink}</p>
			<p><strong>RTT:</strong> ${info.network.rtt}</p>
		`;
		document.getElementById('network-info').innerHTML = networkHtml;

		// Features info.
		const featuresHtml = `
			<p><strong>WebGL:</strong> ${info.features.webGL ? '✓' : '✗'}</p>
			<p><strong>WebRTC:</strong> ${info.features.webRTC ? '✓' : '✗'}</p>
			<p><strong>Local Storage:</strong> ${info.features.localStorage ? '✓' : '✗'}</p>
			<p><strong>Session Storage:</strong> ${info.features.sessionStorage ? '✓' : '✗'}</p>
			<p><strong>IndexedDB:</strong> ${info.features.indexedDB ? '✓' : '✗'}</p>
			<p><strong>Service Worker:</strong> ${info.features.serviceWorker ? '✓' : '✗'}</p>
			<p><strong>Notificaciones:</strong> ${info.features.notifications ? '✓' : '✗'}</p>
			<p><strong>Geolocalización:</strong> ${info.features.geolocation ? '✓' : '✗'}</p>
			<p><strong>Battery:</strong> ${info.features.battery ? '✓' : '✗'}</p>
			<p><strong>Web Audio:</strong> ${info.features.webAudio ? '✓' : '✗'}</p>
			<p><strong>WebAssembly:</strong> ${info.features.webAssembly ? '✓' : '✗'}</p>
		`;
		document.getElementById('features-info').innerHTML = featuresHtml;
	},

	/**
	 * Setup event listeners
	 */
	setupEventListeners: function() {
		// Theme toggle button
		document.getElementById( 'theme-toggle' ).addEventListener( 'click', () => {
			this.toggleTheme();
		} );

		// Info toggle button
		document.getElementById( 'info-toggle' ).addEventListener( 'click', () => {
			this.showInfoModal();
		} );

		// Modal close button
		document.getElementById( 'modal-close' ).addEventListener( 'click', () => {
			this.hideInfoModal();
		} );

		// Close modal clicking outside
		document.getElementById( 'info-modal' ).addEventListener( 'click', ( e ) => {
			if ( e.target.id === 'info-modal' ) {
				this.hideInfoModal();
			}
		} );

		// Close modal with ESC key
		document.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Escape' && !document.getElementById( 'info-modal' ).classList.contains( 'hidden' ) ) {
				this.hideInfoModal();
			}
		} );

		// Copy button
		document.getElementById( 'copy-btn' ).addEventListener( 'click', () => {
			this.copyToClipboard();
		} );

		// Download button
		document.getElementById( 'download-btn' ).addEventListener( 'click', () => {
			this.downloadData();
		} );
	},

	/**
	 * Show info modal and load README
	 */
	showInfoModal: async function() {
		const modal = document.getElementById( 'info-modal' );
		modal.classList.remove( 'hidden' );
		document.body.style.overflow = 'hidden';

		// Load README if not already loaded
		if ( !this.readmeLoaded ) {
			await this.loadReadme();
		}
	},

	/**
	 * Hide info modal
	 */
	hideInfoModal: function() {
		const modal = document.getElementById( 'info-modal' );
		modal.classList.add( 'hidden' );
		document.body.style.overflow = '';
	},

	/**
	 * Load and parse README.md
	 */
	loadReadme: async function() {
		const contentDiv = document.getElementById( 'readme-content' );

		try {
			const response = await fetch( 'README.md' );
			if ( !response.ok ) {
				throw new Error( 'No se pudo cargar el archivo README' );
			}

			const markdown = await response.text();
			contentDiv.innerHTML = this.parseMarkdown( markdown );
			this.readmeLoaded = true;
		} catch ( error ) {
			console.error( 'Error loading README:', error );
			contentDiv.innerHTML = '<p style="color: var(--error-color);">Error al cargar la información del proyecto.</p>';
		}
	},

	/**
	 * Simple markdown to HTML parser
	 */
	parseMarkdown: function( markdown ) {
		let html = markdown;

		// Headers
		html = html.replace( /^### (.*$)/gim, '<h3>$1</h3>' );
		html = html.replace( /^## (.*$)/gim, '<h2>$1</h2>' );
		html = html.replace( /^# (.*$)/gim, '<h1>$1</h1>' );

		// Bold
		html = html.replace( /\*\*(.*?)\*\*/g, '<strong>$1</strong>' );

		// Code blocks
		html = html.replace( /```[\s\S]*?```/g, ( match ) => {
			const code = match.replace( /```/g, '' ).trim();
			return `<pre><code>${this.escapeHtml( code )}</code></pre>`;
		} );

		// Inline code
		html = html.replace( /`([^`]+)`/g, '<code>$1</code>' );

		// Lists
		html = html.replace( /^\* (.*$)/gim, '<li>$1</li>' );
		html = html.replace( /^- (.*$)/gim, '<li>$1</li>' );
		html = html.replace( /(<li>.*<\/li>)/s, '<ul>$1</ul>' );

		// Paragraphs
		html = html.split( '\n\n' ).map( paragraph => {
			if ( !paragraph.startsWith( '<' ) ) {
				return `<p>${paragraph.replace( /\n/g, '<br>' )}</p>`;
			}
			return paragraph;
		} ).join( '\n' );

		return html;
	},

	/**
	 * Escape HTML special characters
	 */
	escapeHtml: function( text ) {
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace( /[&<>"']/g, ( m ) => map[m] );
	},

	/**
	 * Generate text report from system data
	 */
	generateTextReport: function() {
		const info = this.systemData;
		const now  = new Date();

		let report = '==============================================\n';
		report += 'INFORMACIÓN DEL SISTEMA DE USUARIO\n';
		report += '==============================================\n\n';
		report += `Fecha: ${now.toLocaleDateString('es-ES')}\n`;
		report += `Hora: ${now.toLocaleTimeString('es-ES')}\n`;
		report += `URL: ${globalThis.location.href}\n\n`;

		// Browser info
		report += '----------------------------------------------\n';
		report += 'NAVEGADOR\n';
		report += '----------------------------------------------\n';
		report += `Navegador: ${info.browser.name} ${info.browser.version}\n`;
		report += `User Agent: ${info.browser.userAgent}\n`;
		report += `Idioma: ${info.browser.language}\n`;
		report += `Idiomas disponibles: ${info.browser.languages}\n`;
		report += `Cookies habilitadas: ${info.browser.cookiesEnabled ? 'Sí' : 'No'}\n`;
		report += `En línea: ${info.browser.onLine ? 'Sí' : 'No'}\n`;
		report += `Do Not Track: ${info.browser.doNotTrack}\n\n`;

		// System info
		report += '----------------------------------------------\n';
		report += 'SISTEMA\n';
		report += '----------------------------------------------\n';
		report += `Sistema operativo: ${info.system.os}\n`;
		report += `Plataforma: ${info.system.platform}\n`;
		report += `Dispositivo móvil: ${info.system.mobile ? 'Sí' : 'No'}\n`;
		report += `Núcleos CPU: ${info.system.cores}\n`;
		report += `Memoria: ${info.system.memory}\n\n`;

		// Screen info
		report += '----------------------------------------------\n';
		report += 'PANTALLA\n';
		report += '----------------------------------------------\n';
		report += `Resolución: ${info.screen.resolution}\n`;
		report += `Resolución disponible: ${info.screen.availableResolution}\n`;
		report += `Viewport: ${info.screen.viewport}\n`;
		report += `Profundidad de color: ${info.screen.colorDepth}\n`;
		report += `Pixel Ratio: ${info.screen.pixelRatio}\n`;
		report += `Orientación: ${info.screen.orientation}\n\n`;

		// Network info
		report += '----------------------------------------------\n';
		report += 'RED\n';
		report += '----------------------------------------------\n';
		report += `IP: ${info.network.ip}\n`;
		report += `ISP: ${info.network.isp}\n`;
		report += `Ciudad: ${info.network.city}\n`;
		report += `Región: ${info.network.region}\n`;
		report += `País: ${info.network.country}\n`;
		report += `Zona horaria: ${info.network.timezone}\n`;
		report += `Tipo de conexión: ${info.network.connection}\n`;
		report += `Tipo efectivo: ${info.network.effectiveType}\n`;
		report += `Velocidad bajada: ${info.network.downlink}\n`;
		report += `RTT: ${info.network.rtt}\n\n`;

		// Features info
		report += '----------------------------------------------\n';
		report += 'CARACTERÍSTICAS DEL NAVEGADOR\n';
		report += '----------------------------------------------\n';
		for ( const [feature, supported] of Object.entries( info.features ) ) {
			const label = feature.charAt(0).toUpperCase() + feature.slice(1);
			report += `${label}: ${supported ? '✓ Soportado' : '✗ No soportado'}\n`;
		}

		report += '\n==============================================\n';

		return report;
	},

	/**
	 * Update textarea with report
	 */
	updateTextarea: function() {
		const textarea = document.getElementById( 'export-textarea' );
		textarea.value = this.generateTextReport();
	},

	/**
	 * Copy to clipboard
	 */
	copyToClipboard: async function() {
		const textarea = document.getElementById( 'export-textarea' );

		try {
			await navigator.clipboard.writeText( textarea.value );
			this.showMessage( '✓ Información copiada al portapapeles', 'success' );
		} catch {
			// Fallback for older browsers using deprecated execCommand
			// This is intentional for backward compatibility
			try {
				textarea.select();
				// eslint-disable-next-line deprecation/deprecation
				const success = document.execCommand( 'copy' );
				if ( success ) {
					this.showMessage( '✓ Información copiada al portapapeles', 'success' );
				} else {
					this.showMessage( '✗ Error al copiar al portapapeles', 'error' );
				}
			} catch ( fallbackError ) {
				console.error( 'Error copying to clipboard:', fallbackError );
				this.showMessage( '✗ Error al copiar al portapapeles', 'error' );
			}
		}
	},

	/**
	 * Download data as text file
	 */
	downloadData: function() {
		const text = this.generateTextReport();
		const blob = new Blob( [text], { type: 'text/plain;charset=utf-8' } );
		const url  = URL.createObjectURL( blob );
		const link = document.createElement( 'a' );

		// Generate filename with format: info-usuario.YYYY_MM_DD_HH_MM.txt
		const now      = new Date();
		const year     = now.getFullYear();
		const month    = String( now.getMonth() + 1 ).padStart( 2, '0' );
		const day      = String( now.getDate() ).padStart( 2, '0' );
		const hours    = String( now.getHours() ).padStart( 2, '0' );
		const minutes  = String( now.getMinutes() ).padStart( 2, '0' );
		const filename = `info-usuario-${year}_${month}_${day}_${hours}_${minutes}.txt`;

		link.href     = url;
		link.download = filename;
		link.click();

		URL.revokeObjectURL( url );
		this.showMessage( '✓ Archivo descargado correctamente', 'success' );
	},

	/**
	 * Show message to user
	 */
	showMessage: function( message, type ) {
		const messageEl       = document.getElementById( 'message' );
		messageEl.textContent = message;
		messageEl.className   = `message ${type}`;

		setTimeout( () => {
			messageEl.textContent = '';
			messageEl.className   = 'message';
		}, 10000);
	}
};

// Initialize when DOM is ready
document.addEventListener( 'DOMContentLoaded', () => {
	cl_diagnostics.init();
} );
