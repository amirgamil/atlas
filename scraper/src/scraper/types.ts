export interface ParamData {
    fromBlock: string;
    category: string[];
    pageKey?: string;
    toBlock?: string;
    fromAddress?: string;
}

export interface Payload {
    jsonrpc: string;
    method: string;
    params: ParamData[];
}

export interface Transfer {
    blockNum: string;
    hash: string;
    from: string;
    to: string;
    value: number;
    erc721TokenId?: string;
    erc1155Metadata?: string;
    asset: string;
    category: string;
    rawContract: RawContract;
    method?: string;
}

export interface Response {
    result: {
        transfers: Array<Transfer>;
        pageKey: string;
    };
}

export interface RawContract {
    value?: string;
    address?: string;
    decimal?: string;
}
