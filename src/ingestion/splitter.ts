import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export function createSplitter(): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
  });
}
