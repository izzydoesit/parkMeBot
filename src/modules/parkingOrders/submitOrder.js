import { log } from '../../utils';
import { postChatMessage, sendDirectMessage } from '../slack';

const millisecondsTS = Date.parse(input);
const desiredDate = new Date(millisecondsTS);

const slackConfig = config.get('slack');
