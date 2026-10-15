import { Anchor, Box, Group, Kbd, List, Paper, Stack, Text, Title } from '@mantine/core';
import { type ReactNode, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { usePageTitle } from '../layout/usePageTitle';
import { Crescent, SectionTitle } from '../theme/SectionTitle';
import { tapeProps } from '../theme/tape';

function PageLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Anchor component={Link} to={to}>
      {children}
    </Anchor>
  );
}

interface HelpSection {
  id: string;
  title: string;
  content: ReactNode;
}

const sections: HelpSection[] = [
  {
    id: 'premiers-pas',
    title: 'Premiers pas',
    content: (
      <>
        <Text>
          Crée un compte avec ton e-mail et un mot de passe d'au moins 8 caractères. Le pseudo est facultatif : il
          s'affiche à la place de ton e-mail et tu peux le changer plus tard.
        </Text>
        <Text>
          L'<PageLink to="/">accueil</PageLink> résume ton carnet : le nombre de cartes, de rangements et de decks, tes{' '}
          <b>Decks récents</b> et tes <b>Dernières trouvailles</b>, les cartes ajoutées le plus récemment.
        </Text>
      </>
    ),
  },
  {
    id: 'collection',
    title: 'Ta collection',
    content: (
      <>
        <Text>
          La page <PageLink to="/cards">Collection</PageLink> liste toutes tes cartes. Pour en ajouter une, cherche-la
          dans <b>Ajouter une carte</b> (la syntaxe de Scryfall marche aussi, comme <code>t:creature c:g</code>), puis
          choisis l'édition, le nombre d'exemplaires, le foil, le proxy et le rangement. Tu peux aussi glisser-déposer
          une carte depuis scryfall.com, directement dans l'édition voulue.
        </Text>
        <Text>
          Le menu d'import accepte un fichier Tamiyo (.json), un export ManaBox ou un CSV Moxfield. L'export propose
          toute ta collection en CSV, <b>Pour Moxfield</b> ou <b>Pour ManaBox</b>, ou au <b>Format Tamiyo (JSON)</b>{' '}
          pour la réimporter plus tard.
        </Text>
        <Text>
          Les prix viennent de Scryfall, en euros (Cardmarket) ou en dollars (TCGplayer) : choisis la devise, ou masque
          les prix, dans <PageLink to="/settings?section=apparence">Paramètres → Apparence</PageLink>.
        </Text>
      </>
    ),
  },
  {
    id: 'rangements',
    title: 'Rangements',
    content: (
      <>
        <Text>
          Un rangement, c'est l'endroit où dorment tes cartes en vrai : un classeur, une boîte, une deckbox… Sur la page{' '}
          <PageLink to="/storages">Rangements</PageLink>, clique sur <b>Nouveau rangement</b>, donne-lui un nom et un
          type. Chaque carte de ta collection peut ensuite être placée dans un rangement.
        </Text>
        <Text>
          Sur la page d'un rangement, le menu permet de <b>Modifier</b>, de le supprimer, d'<b>Importer des cartes</b>{' '}
          ou de l'exporter en CSV ou en JSON. Supprimer un rangement ne supprime pas ses cartes : elles restent dans ta
          collection, sans rangement.
        </Text>
        <Text>
          <b>Verrouiller pour les decks…</b> réserve un rangement : seuls les decks que tu choisis peuvent piocher
          dedans quand tu leur ajoutes des cartes. Laisse la liste vide pour le fermer à tous les decks.
        </Text>
      </>
    ),
  },
  {
    id: 'recherche',
    title: 'Rechercher des cartes',
    content: (
      <>
        <Text>
          Dans ta collection, un rangement ou un deck, <b>Filtrer par nom</b> cherche dans les noms, et le bouton{' '}
          <b>Recherche avancée</b> ouvre les autres filtres :
        </Text>
        <List spacing={4}>
          <List.Item>
            <b>Couleurs</b> : <b>Exactement</b> ces couleurs, <b>Au moins</b> celles-ci, ou <b>Au plus</b> celles-ci.
          </List.Item>
          <List.Item>
            <b>Nombre de couleurs</b>, et <b>Couleurs du commandant</b> pour ne garder que les cartes jouables avec un
            commandant de cette identité.
          </List.Item>
          <List.Item>
            <b>Coût de mana</b>, <b>Force</b> et <b>Endurance</b>, avec une comparaison : égal, inférieur, supérieur…
          </List.Item>
          <List.Item>
            <b>Type</b>, <b>Sous-type</b> (Elf, Vehicle, Equipment…) et <b>Légale en</b> pour un format.
          </List.Item>
          <List.Item>
            <b>Foil</b>, <b>Type de rangement</b> et <b>Rangement</b>.
          </List.Item>
        </List>
        <Text>
          <b>Grouper par</b> range les cartes par type, couleur ou coût de mana (et par rangement ou tag dans un deck).
          Les options d'affichage proposent quatre modes : <b>Texte</b>, <b>Images</b>, <b>Grille</b> et <b>Piles</b>.
          Tes choix sont gardés d'une visite à l'autre.
        </Text>
      </>
    ),
  },
  {
    id: 'decks',
    title: 'Decks',
    content: (
      <>
        <Text>
          Sur la page <PageLink to="/decks">Decks</PageLink>, <b>Nouveau deck</b> demande un nom, un format (le nom
          Scryfall : commander, modern, pauper…), une visibilité et, en Commander, un bracket. En Commander, tu peux
          aussi chercher ton commandant parmi les cartes qui peuvent l'être : s'il n'est pas dans ta collection, il
          arrive en attente. Tu peux coller une liste (« 4 Lightning Bolt », une carte par ligne) ou choisir un fichier
          texte : les cartes que tu possèdes sont reprises de ta collection, les autres arrivent en attente. Coche{' '}
          <b>La première ligne est le commandant</b> si besoin.
        </Text>
        <Text>
          Range tes decks dans des dossiers et des sous-dossiers : glisse un deck sur le nom d'un dossier pour l'y
          mettre, ou utilise <b>Ranger dans un dossier</b> depuis le deck. L'étoile ajoute un deck à tes favoris. Sur
          téléphone, le glisser-déposer n'est pas disponible : un appui long sur un deck, une carte ou un rangement
          ouvre le même menu que le clic droit.
        </Text>
      </>
    ),
  },
  {
    id: 'construire',
    title: 'Construire un deck',
    content: (
      <>
        <Text>
          Un deck a trois sections : le <b>Deck principal</b>, le <b>Sideboard</b> et <b>Considering</b>, pour les
          cartes que tu envisages. <b>Ajouter des cartes</b> pioche dans ta collection ; ouvre une carte du deck pour la
          déplacer d'une section à l'autre ou la <b>Définir comme commandant</b>.
        </Text>
        <Text>
          Une carte que tu n'as pas encore est <b>en attente</b>, en orange : elle compte dans le deck, mais pas dans ta
          collection. Le bandeau « Une carte de ce deck n'est pas encore dans ta collection » permet de les ajouter d'un
          coup, dans le rangement de ton choix. L'interrupteur <b>Ma collection</b> affiche ou masque les cartes en
          attente et le rangement de chaque exemplaire.
        </Text>
        <Text>
          Les tags (Ramp, Pioche, Removal…) se posent sur une carte et sont partagés par tous ses exemplaires du deck.{' '}
          <b>Gérer les tags</b> les renomme ou les supprime, et <b>Grouper par</b> → <b>Tag</b> ou <b>Rangement</b>{' '}
          réorganise la liste. En glissant une carte, une barre apparaît pour la déposer dans une section, lui ajouter
          un tag ou la retirer du deck.
        </Text>
        <Text>
          <b>Édition en masse</b> modifie le deck sous forme de liste texte. Dans une carte, tu peux changer d'édition
          ou <b>Séparer les éditions…</b> de plusieurs exemplaires. <b>Illustration</b> choisit l'image de couverture du
          deck. Tu peux aussi glisser-déposer une carte depuis scryfall.com sur la page du deck.
        </Text>
        <Text>
          <b>Statistiques</b> montre la courbe de mana, la répartition par couleur et par type, et le prix. La valeur du
          deck ne compte ni les proxys, ni le sideboard, ni les cartes envisagées. Si une carte n'est pas légale dans le
          format, un avertissement l'indique ; en Commander, le bracket (Exhibition, Core, Upgraded, Optimized, cEDH)
          s'affiche sur le deck.
        </Text>
      </>
    ),
  },
  {
    id: 'playtest',
    title: 'Playtest',
    content: (
      <>
        <Text>
          <b>Tester le deck</b>, sur la page d'un deck, ouvre une table de jeu : bibliothèque, main, champ de bataille,
          cimetière, exil et zone de commandement, avec les points de vie et les compteurs (poison, énergie,
          expérience).
        </Text>
        <Text>
          Double-clique une carte de ta main pour la jouer, une carte en jeu pour l'engager. Le clic droit ouvre les
          autres actions (retourner, transformer, <b>Marqueurs</b>, <b>Copier (jeton)</b>…) et le glisser-déposer
          déplace une carte. Sur téléphone, touche une carte pour ouvrir ses actions et garde le doigt appuyé pour la
          déplacer. <b>Jeton</b> crée des jetons, en proposant d'abord ceux des cartes du deck.
        </Text>
        <Text>
          Le menu de la bibliothèque sert à <b>Piocher plusieurs cartes…</b>, <b>Meuler…</b>, <b>Mélanger</b>,{' '}
          <b>Chercher une carte</b> ou <b>Regarder le dessus…</b> pour remettre les cartes dessus ou dessous.{' '}
          <b>Tour suivant</b> dégage tout et pioche, <b>Mulligan</b> et <b>Recommencer</b> relancent la partie, et les
          boutons de zoom agrandissent ou réduisent les cartes.
        </Text>
        <Text>
          Raccourcis : <Kbd>D</Kbd> piocher, <Kbd>N</Kbd> tour suivant, <Kbd>S</Kbd> mélanger, <Kbd>U</Kbd> tout
          dégager, <Kbd>L</Kbd> voir la bibliothèque, <Kbd>X</Kbd> copier la carte survolée, <Kbd>Ctrl Z</Kbd> annuler.
        </Text>
      </>
    ),
  },
  {
    id: 'deck-collection',
    title: 'Du deck à la collection',
    content: (
      <>
        <Text>Le menu d'un deck propose trois actions :</Text>
        <List spacing={4}>
          <List.Item>
            <b>Ajouter à ma collection</b> : sur ton deck, <b>Seulement les cartes en attente</b> ou{' '}
            <b>Toutes les cartes du deck</b> ; sur le deck de quelqu'un d'autre, <b>Seulement celles qui me manquent</b>{' '}
            ou <b>Toutes</b>. Tu choisis les sections concernées et le rangement des nouvelles cartes.
          </List.Item>
          <List.Item>
            <b>Ranger les cartes…</b> déplace les cartes de ton deck dans un rangement, existant ou nouveau. Les cartes
            en attente ne sont pas concernées.
          </List.Item>
          <List.Item>
            <b>Dupliquer</b> crée ta propre copie du deck, avec tes cartes quand tu les as et des cartes en attente
            sinon.
          </List.Item>
        </List>
      </>
    ),
  },
  {
    id: 'partager',
    title: 'Partager et découvrir',
    content: (
      <>
        <Text>Chaque deck a une visibilité :</Text>
        <List spacing={4}>
          <List.Item>
            <b>Privé</b> : toi seul peux le voir.
          </List.Item>
          <List.Item>
            <b>Non répertorié</b> : visible par toute personne qui a son lien, même sans compte.
          </List.Item>
          <List.Item>
            <b>Public</b> : visible avec son lien, listé sur ton profil et dans l'explorateur.
          </List.Item>
        </List>
        <Text>
          <b>Partager</b> donne le lien à copier, et <b>Exporter</b> sort la liste pour Moxfield, MTG Arena, Cardmarket
          ou Tamiyo.
        </Text>
        <Text>
          <PageLink to="/explorer">Explorer</PageLink> liste les decks publics, avec des filtres par nom, format,
          commandant, couleurs, carte contenue, joueur ou bracket. Le cœur aime un deck : tu le retrouves dans{' '}
          <PageLink to="/decks-aimes">Decks aimés</PageLink>. <b>Comparer avec un autre deck</b> montre les cartes en
          commun et celles qui ne sont que d'un côté.
        </Text>
        <Text>
          Clique sur un pseudo pour voir un profil et ses decks publics, puis <b>Suivre</b> la personne. Tes abonnements
          et tes abonnés sont dans <b>Mes connexions</b>, depuis le menu de ton avatar.
        </Text>
      </>
    ),
  },
  {
    id: 'compte',
    title: 'Ton compte',
    content: (
      <>
        <Text>
          <PageLink to="/settings">Paramètres</PageLink> regroupe :
        </Text>
        <List spacing={4}>
          <List.Item>
            <b>Profil</b> : ton pseudo et ton image de profil, choisie parmi les illustrations de Scryfall.
          </List.Item>
          <List.Item>
            <b>Apparence</b> : <b>Jour</b>, <b>Nuit</b> ou <b>Selon l'heure</b>, avec les heures de début et de fin de
            la nuit, et l'affichage des prix.
          </List.Item>
          <List.Item>
            <b>Compte</b> : changer ton e-mail (un code de confirmation est envoyé à ton adresse actuelle) ou ton mot de
            passe.
          </List.Item>
          <List.Item>
            <b>Zone de danger</b> : supprimer toute ta collection, après avoir tapé SUPPRIMER pour confirmer.
          </List.Item>
        </List>
      </>
    ),
  },
];

const HEADER_OFFSET = 72;

function sectionFromHash(hash: string) {
  const id = hash.replace(/^#/, '');
  return sections.find((section) => section.id === id) ?? sections[0];
}

function Summary({ opened, onOpen }: { opened: string; onOpen: (id: string) => void }) {
  return (
    <Paper withBorder shadow="sm" radius="md" p="md" pt="lg" {...tapeProps('help-summary')}>
      <Stack gap={6} component="nav" aria-label="Sommaire">
        <Text className="tamiyo-hand" size="xl" px={8}>
          Sommaire
        </Text>
        <Stack gap={2}>
          {sections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="tamiyo-toc-link"
              data-active={section.id === opened || undefined}
              aria-current={section.id === opened ? 'location' : undefined}
              onClick={(event) => {
                event.preventDefault();
                onOpen(section.id);
              }}
            >
              <Text span className="tamiyo-hand" c="prune" size="lg" w={18} ta="right">
                {index + 1}
              </Text>
              <span className="tamiyo-toc-title" data-text={section.title}>
                {section.title}
              </span>
              <span style={{ visibility: section.id === opened ? 'visible' : 'hidden' }}>
                <Crescent size={12} />
              </span>
            </a>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

export function HelpPage() {
  usePageTitle('Aide');
  const { hash } = useLocation();
  const navigate = useNavigate();
  const opened = sectionFromHash(hash);
  const content = useRef<HTMLDivElement>(null);

  function open(id: string) {
    navigate({ hash: id }, { replace: true });
    const top = content.current?.getBoundingClientRect().top ?? 0;
    if (top < HEADER_OFFSET || top > window.innerHeight / 2) {
      content.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <Group align="flex-start" gap="xl" wrap="nowrap">
      <Box visibleFrom="sm" style={{ position: 'sticky', top: HEADER_OFFSET, flexShrink: 0 }}>
        <Summary opened={opened.id} onOpen={open} />
      </Box>
      <Stack gap="xl" maw={900} style={{ flex: 1, minWidth: 0 }}>
        <Stack gap="xs">
          <Title order={2}>Aide</Title>
          <Text c="dimmed">
            Tamiyo est ton carnet de collectionneur Magic : tes cartes, où elles sont rangées, et les decks que tu en
            tires. Choisis un thème dans le sommaire pour voir comment t'en servir.
          </Text>
        </Stack>
        <Box hiddenFrom="sm">
          <Summary opened={opened.id} onOpen={open} />
        </Box>
        <Stack ref={content} gap="sm" style={{ scrollMarginTop: HEADER_OFFSET }}>
          <SectionTitle>{opened.title}</SectionTitle>
          {opened.content}
        </Stack>
      </Stack>
    </Group>
  );
}
