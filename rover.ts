/**
 * Blocs pour opérer le Rover M.A.R.S. 4tronix
 */
//% weight=10 color=#e7660b icon="\uf135"
namespace marsRover {
    let PCA = 0x40;    // adresse i2c du contrôleur servo Animoid 4tronix
    let EEROM = 0x50;    // adresse i2c de l'EEROM
    let initI2C = false;
    let SERVOS = 0x06; // première adresse servo pour octet de départ bas
    let vitesseGauche = 0;
    let vitesseDroite = 0;
    let servoOffsets: number[] = [];
    let bandeLED: fireled.Band;
    let _modeMiseAJour = RVmodeMiseAJour.Auto;

    // Constantes IR du Rover MARS
    const brochePIN = DigitalPin.P16;
    const evenementIR = 1995;

    /**
      * Énumération des servos
      */
    enum RVservos {
        //% block="avant gauche"
        AvantGauche=9,
        //% block="arrière gauche"
        ArriereGauche=11,
        //% block="arrière droit"
        ArriereDroit=13,
        //% block="avant droit"
        AvantDroit=15,
        //% block="mât"
        Mat=0
    }

    /**
      * Énumération des groupes de servos
      */
    enum RVgroupeServo {
        //% block="roue"
        Roue,
        //% block="mât"
        Mat,
        //% block="tout"
        Tout
    }

    /**
      * Énumération des directions gauche/droite
      */
    enum RVdirection {
        //% block="gauche"
        Gauche,
        //% block="droite"
        Droite
    }

    /**
      * Énumération des directions avant/arrière
      */
    enum RVvecteur {
        //% block="avant"
        Avant,
        //% block="arrière"
        Arriere
    }

    /**
     * Énumération des modes de mise à jour
     */
    enum RVmodeMiseAJour {
        //% block="auto"
        Auto,
        //% block="manuel"
        Manuel
    }

    /**
     * Initialise le module I2C si nécessaire
     */
    function initPCA(): void {
        if (initI2C)
            return;
        initI2C = true;
        pins.i2cWriteNumber(PCA, 0, NumberFormat.Int8LE);
        pins.i2cWriteNumber(PCA, 0, NumberFormat.Int8LE);
        // Mode normal, permet le contrôle des servos
        pins.i2cWriteNumber(PCA, 0x01, NumberFormat.Int8LE);
    }

    /**
     * Définit la vitesse d'un moteur
     * @param servo Numéro du servo (0-15)
     * @param vitesse Vitesse entre -100 et +100
     */
    //% block="définir vitesse du moteur %servo à %vitesse"
    //% vitesse.min=-100 vitesse.max=100
    //% weight=90
    export function definirVitesseMoteur(servo: RVservos, vitesse: number): void {
        initPCA();
        if (vitesse > 100) vitesse = 100;
        if (vitesse < -100) vitesse = -100;
        let value = Math.map(vitesse, -100, 100, 0, 180);
        value = value + (servoOffsets[servo] || 0);
        setPCA(servo, value);
    }

    /**
     * Fait avancer le rover
     * @param vitesse Vitesse entre 0 et 100
     */
    //% block="avancer à vitesse %vitesse"
    //% vitesse.min=0 vitesse.max=100
    //% weight=80
    export function avancer(vitesse: number): void {
        vitesseGauche = vitesse;
        vitesseDroite = vitesse;
        definirVitesseMoteur(RVservos.AvantGauche, vitesseGauche);
        definirVitesseMoteur(RVservos.ArriereGauche, vitesseGauche);
        definirVitesseMoteur(RVservos.AvantDroit, vitesseDroite);
        definirVitesseMoteur(RVservos.ArriereDroit, vitesseDroite);
    }

    /**
     * Fait reculer le rover
     * @param vitesse Vitesse entre 0 et 100
     */
    //% block="reculer à vitesse %vitesse"
    //% vitesse.min=0 vitesse.max=100
    //% weight=70
    export function reculer(vitesse: number): void {
        avancer(-vitesse);
    }

    /**
     * Fait tourner le rover
     * @param direction Direction de rotation (gauche/droite)
     * @param vitesse Vitesse de rotation entre 0 et 100
     */
    //% block="tourner %direction à vitesse %vitesse"
    //% vitesse.min=0 vitesse.max=100
    //% weight=60
    export function tourner(direction: RVdirection, vitesse: number): void {
        if (direction == RVdirection.Gauche) {
            vitesseGauche = -vitesse;
            vitesseDroite = vitesse;
        } else {
            vitesseGauche = vitesse;
            vitesseDroite = -vitesse;
        }
        definirVitesseMoteur(RVservos.AvantGauche, vitesseGauche);
        definirVitesseMoteur(RVservos.ArriereGauche, vitesseGauche);
        definirVitesseMoteur(RVservos.AvantDroit, vitesseDroite);
        definirVitesseMoteur(RVservos.ArriereDroit, vitesseDroite);
    }

    /**
     * Arrête le rover
     */
    //% block="arrêter"
    //% weight=50
    export function arreter(): void {
        vitesseGauche = 0;
        vitesseDroite = 0;
        definirVitesseMoteur(RVservos.AvantGauche, 0);
        definirVitesseMoteur(RVservos.ArriereGauche, 0);
        definirVitesseMoteur(RVservos.AvantDroit, 0);
        definirVitesseMoteur(RVservos.ArriereDroit, 0);
    }

    /**
     * Configure la bande LED
     * @param broche Broche de données pour la bande LED
     * @param nombre Nombre de LEDs dans la bande
     */
    //% block="configurer bande LED sur broche %broche avec %nombre LEDs"
    //% weight=40
    export function configurerBandeLED(broche: DigitalPin, nombre: number): void {
        bandeLED = fireled.Band.create(broche, nombre);
    }

    /**
     * Définit la couleur d'une LED
     * @param position Position de la LED (0 à nombre-1)
     * @param couleur Couleur de la LED
     */
    //% block="définir LED %position en %couleur"
    //% weight=30
    export function definirLED(position: number, couleur: number): void {
        if (!bandeLED) return;
        bandeLED.setPixelColor(position, couleur);
        if (_modeMiseAJour == RVmodeMiseAJour.Auto)
            bandeLED.show();
    }

    /**
     * Met à jour l'affichage des LEDs
     */
    //% block="mettre à jour les LEDs"
    //% weight=20
    export function mettreAJourLEDs(): void {
        if (!bandeLED) return;
        bandeLED.show();
    }

    /**
     * Configure le mode de mise à jour des LEDs
     */
    //% block="définir mode mise à jour LED %mode"
    //% weight=10
    export function definirModeMiseAJour(mode: RVmodeMiseAJour): void {
        _modeMiseAJour = mode;
    }

    // Fonction interne pour configurer le PCA9685
    function setPCA(servo: number, angle: number): void {
        if (servo < 0 || servo > 15)
            return;

        let value = Math.map(angle, 0, 180, 102, 512);
        let buffer = pins.createBuffer(2);
        buffer[0] = SERVOS + (servo * 4);
        buffer[1] = value & 0xff;
        pins.i2cWriteBuffer(PCA, buffer);
        buffer[0] = SERVOS + (servo * 4) + 1;
        buffer[1] = value >> 8;
        pins.i2cWriteBuffer(PCA, buffer);
    }
}
