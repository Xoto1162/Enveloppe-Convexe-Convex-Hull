// Instanciation d'un objet sigma
var s = new sigma("sigma-container");

// récupération de la caméra de base et on la place au centre du graph
var c = s.camera;
c.goTo({x: 25, y: 25, ratio: 0.06});

/**
 * Variable qui contient tous les points appartenant a l'enveloppe convex
 * @type {Array}
 */
var convexNodes = [];

/**
 * Variable qui permet d'enregistrer la couleur et la taille des traits et des points
 * @type {{colorNode: string, colorConvexNode: string, sizeNode: number, sizeEdge: number}}
 */
var Settings = {
	'colorNode': '#000000',
	'colorConvexNode': '#FF0000',
	'sizeNode': 1.5,
	'sizeEdge': 1,
}

// Réglage des parametres de base de la librairie
s.settings({
	sideMargin: 0.2,
	autoRescale: false,
	doubleClickEnabled: false,
	zoomMax: 0.6,
	zoomMin: 0.02,
});

// Récupération du graph pour ensuite lui ajouter des evenement
var graph = document.querySelector('#sigma-container canvas:last-child');

// Ajout d'un evenement sur le graph pour ajouter un point lors du clic sur la molette
graph.addEventListener('mousedown', function(e) {
	if (e.buttons == 4){
		var x = sigma.utils.getX(e) - graph.offsetWidth / 2;
		var y = sigma.utils.getY(e) - graph.offsetHeight / 2;

		p = c.cameraPosition(x, y);
		x = p.x;
		y = p.y;

		s.graph.addNode({
			id: "n" + s.graph.nodes().length,
			size: Settings.sizeNode,
			x: x,
			y: y 
		});

		generateEnvelop();
	}
});

// Suppression d'un point au clic molette (Evenement SigmaJS)
s.bind('rightClickNode', function(e) {
	s.graph.edges().forEach(function(e) {
		s.graph.dropEdge(e.id);
	})

    var nodeDeletedId = parseInt(e.data.node.id.slice(1));
    s.graph.dropNode(e.data.node.id);    

    for (var i = nodeDeletedId + 1; i <= s.graph.nodes().length; i++) {
		var oldX = s.graph.nodes("n" + i).x;
		var oldY = s.graph.nodes("n" + i).y;

		s.graph.dropNode("n" + i);

		s.graph.addNode({
			id: ('n' + (i - 1)),
			x: oldX,
			y: oldY,
			size: Settings.sizeNode,
			color: Settings.colorNode,
			label: ('n' + (i - 1))
		});
	}

    generateEnvelop();
});

// Création d'un ecouteur d'evenement pour le deplacement des points (plugin SigmaJS)
var dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);

// mise en place de l'ecouteur d'ï¿½venement pour le deplacement des points
// Quand on deplace un point on recalcule l'enveloppe convex.
dragListener.bind('drag', function() {
	generateEnvelop();
});

/**
 * Fonctionne qui genere le nombre de point demander
 * @param nbrNodes | nombre de points a créer.
 */
function generateNodes(nbrNodes) {
	s.graph.nodes().forEach(function(n) {
		s.graph.dropNode(n.id);
	});

	for (var i = 0; i < nbrNodes; i++) {
		var x = (Math.random()*50);
		var y = (Math.random()*50);

		s.graph.addNode({
			id: "n" + i,
			x: x,
			y : y,
			size: Settings.sizeNode,
			color: Settings.colorNode,
			label: "n" + i
						
		});
	}
	s.refresh();
}

/**
 * Renvoi le point le plus bas sous forme d'objet Node SigmaJs
 * @returns {{}}
 */
function getLowerNodeY() {
	var lowerNode = null;
	s.graph.nodes().forEach(function(n) {
		lowerNode = (lowerNode == null || n.y > lowerNode.y) ? n : lowerNode;
	});
	return lowerNode;
}

/**
 * Permet d'avoir le vecteur a partir de deux points
 * @param firstNode | Objet Node SigmaJs
 * @param secondNode | Objet Node SigmaJs
 * @returns {Array} | le vecteur sous la forme [x, y]
 */
function getVector(firstNode, secondNode) {
 	var vector;
 	var x;
 	var y;

 	x = secondNode.x - firstNode.x;
 	y = secondNode.y - firstNode.y;

 	vector = [x, y];
 	return vector;
}

/**
 * Permet de connaitre la longueur du vecteur passer en parametre
 * @param vector | Array [x, y]
 * @returns {number} | la longueur du vecteur
 */
function vectorLength(vector) {
	var length = Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2));
	return length;
}

/**
 * Calcule le produit scalait de deux vecteurs
 * @param firstVector | Array : [x, y]
 * @param secondVector | Array : [x, y]
 * @returns {number} | Résultat du produit scalaire
 */
function scalare(firstVector, secondVector) {
	var scalare = firstVector[0]*secondVector[0] + firstVector[1]*secondVector[1];
	return scalare;
}

/**
 * Calcule l'angle entre deux vecteur, si le deuxieme vecteur n'est pas passer en parametre l'angle calculer serat celui entre le premier vecteur et l'axe des absices
 * @param firstVector | Array : [x, y]
 * @param secondVector | Array : [x, y]
 * @returns {number} | Valeur de l'angle en degree
 */
function angleCalculation(firstVector, secondVector = [1, 0]) {
	var angleRad = Math.acos((scalare(firstVector, secondVector)) / (vectorLength(firstVector) * vectorLength(secondVector)));
	var angleDeg = ((180 * angleRad) / Math.PI);
	return angleDeg;
}

/**
 * Fonction qui genere l'enveloppe convexe
 */
function generateEnvelop() {
	s.graph.edges().forEach(function(e) {
		s.graph.dropEdge(e.id);
	})
	s.graph.nodes().forEach(function(n) {
		n.color = Settings.colorNode;
	});

	convexNodes = [getLowerNodeY()];
	var toNode;
	var maxAngle = 0;

	for (var i =0; toNode != convexNodes[0] && i < s.graph.nodes().length; i++) {
		s.graph.nodes().forEach(function(n) {
			if (n != convexNodes[i]) {
				if (i == 0) {
					var angle = angleCalculation(getVector(convexNodes[i], n));
				} else {
					var angle = angleCalculation(getVector(convexNodes[i], n), getVector(convexNodes[i], convexNodes[i - 1]));
				}

				if (angle >= maxAngle || angle == 180) {
					maxAngle = angle;
					toNode = n;
				}
			}
		});

		convexNodes.push(toNode);

		s.graph.addEdge({
			id: 'e' + i,
			source: convexNodes[i].id,
			target: convexNodes[i + 1].id,
			size: Settings.sizeEdge
		});

		maxAngle = 0;
	}

	applyColorNode(Settings.colorNode);
}

/**
 * Fonction qui permet de changer la couleur des point appartenant a l'enveloppe convexe
 * @param color | String : code hexadï¿½cimal de la couleur
 */
function applyColorConvexNode(color) {
	Settings.colorConvexNode = color;
	convexNodes.forEach(function(n) {
		n.color = color;
	});
	s.refresh();
}

/**
 * Fonction qui permet de changer la couleur des point appartenant a l'enveloppe convexe
 * @param color | String : code hexadécimal de la couleur
 */
function applyColorNode(color) {
	Settings.colorNode = color;
	s.graph.nodes().forEach(function(n) {
		n.color = color;
	});
	applyColorConvexNode(Settings.colorConvexNode);
}

/**
 * Fonction qui permet de changer la taille des points
 * @param size | number : taille des points
 */
function applySizeNode(size) {
	Settings.sizeNode = size;
	s.graph.nodes().forEach(function(n) {
		n.size = size;
	});
	s.refresh();
}

/**
 * Fonction qui permet de changer la taille des traits
 * @param size | number: taille des traits
 */
function applySizeEdge(size) {
	Settings.sizeEdge = size;
	s.graph.edges().forEach(function(e) {
		e.size = size;
	});
	s.refresh();
}