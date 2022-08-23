/* eslint-disable no-shadow */
import { readable } from 'svelte/store';
import { useQueryClient } from '../queryClientProvider';
import { noop, parseMutationArgs } from '../queryCore/core/utils';
import { MutationObserver } from '../queryCore/core/mutationObserver';
import '../queryCore/core/types';
import { notifyManager } from '../queryCore';
export default function useMutation(arg1, arg2, arg3) {
    const options = parseMutationArgs(arg1, arg2, arg3);
    const queryClient = useQueryClient();
    const observer = new MutationObserver(queryClient, options);
    const mutate = (variables, mutateOptions) => {
        observer.mutate(variables, mutateOptions).catch(noop);
    };
    const initialResult = observer.getCurrentResult();
    const initialMutationResult = Object.assign(Object.assign({}, initialResult), { mutate, mutateAsync: initialResult.mutate });
    const { subscribe } = readable(initialMutationResult, set => {
        return observer.subscribe(notifyManager.batchCalls((result) => {
            // Check if the component is still mounted
            if (observer.hasListeners()) {
                set(Object.assign(Object.assign({}, result), { mutate, mutateAsync: result.mutate }));
            }
        }));
    });
    function setOptions(arg1, arg2, arg3) {
        if (observer.hasListeners()) {
            const newOptions = parseMutationArgs(arg1, arg2, arg3);
            observer.setOptions(newOptions);
        }
    }
    return { subscribe, setOptions };
}
