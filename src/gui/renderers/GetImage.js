import RUrl from '../../../assets/R.png';
import CUrl from '../../../assets/C.png';

export function GetImage(type) {
    if (type === 'R.png') {
        return RUrl;
    } else if (type === 'C.png') {
        return CUrl;
    } else {
        throw new Error(`Unknown type: ${type}`);
    }
}
