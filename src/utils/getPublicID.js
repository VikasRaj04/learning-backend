const getPublicIdFromUrl = (url) => {
    const parts = url.split('/');

    const fileWithExt = parts.pop(); // c0ronbfmhkduzlmu5zxi.png
    const fileName = fileWithExt.split('.')[0]; // c0ronbfmhkduzlmu5zxi

    return fileName;
};

export default getPublicIdFromUrl