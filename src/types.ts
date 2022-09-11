export enum PushFlags {
    NONE,
    WIP,
    PRIVATE,
    READY,
    REMOVE_PRIVATE
}

export const PushFlagsStrings: Map<PushFlags, string> = new Map<PushFlags, string>([
    [PushFlags.NONE, ""],
    [PushFlags.WIP, "%wip"],
    [PushFlags.PRIVATE, "%private"],
    [PushFlags.READY, "%ready"],
    [PushFlags.REMOVE_PRIVATE, "%remove-private"]
]);

export const PushFlagsPickOptions: Map<string, PushFlags> = new Map<string, PushFlags>([
    ["None", PushFlags.NONE],
    ["Work in Progress", PushFlags.WIP],
    ["Private", PushFlags.PRIVATE],
    ["Remove Work in Progress", PushFlags.READY],
    ["Remove Private", PushFlags.REMOVE_PRIVATE]
]);
