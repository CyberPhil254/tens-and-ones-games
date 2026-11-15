import bunny from '../art/friends/bunny.webp';
import elephant from '../art/friends/elephant.webp';
import giraffe from '../art/friends/giraffe.webp';
import hippo from '../art/friends/hippo.webp';
import kitten from '../art/friends/kitten.webp';
import lion from '../art/friends/lion.webp';
import monkey from '../art/friends/monkey.webp';
import owl from '../art/friends/owl.webp';
import zebra from '../art/friends/zebra.webp';
import type { Friend } from '../data/profile';

const PICTURES: Record<Friend, string> = { bunny, elephant, giraffe, hippo, kitten, lion, monkey, owl, zebra };

/** The animal a child chose for her profile. Pictures from art/friends/, shrunk by tools/art/app.py. */
export function FriendPicture({ friend, size = 56 }: { friend: Friend; size?: number }) {
  return <img className="friend" src={PICTURES[friend]} alt={friend} width={size} height={size} draggable={false} />;
}
