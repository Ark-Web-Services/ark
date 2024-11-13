
type FaceData = {
    title: string;
    content: string;
    visualConcept: string;
};

type DisplayFaceInfoProps = {
    faceData: FaceData;
};

export default function DisplayFaceInfo({ faceData }: DisplayFaceInfoProps) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '15px 25px',
            borderRadius: '10px',
            color: '#fff',
            textAlign: 'center',
            maxWidth: '400px',
            fontFamily: 'Arial, sans-serif',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
        }}>
            <div>
                <h1 style={{ marginBottom: '10px', fontSize: '1.8em' }}>{faceData.title}</h1>
                <p style={{ margin: '5px 0', fontSize: '1em' }}>{faceData.content}</p>
                <p style={{ margin: '5px 0', fontSize: '1em' }}><em>{faceData.visualConcept}</em></p>
            </div>
        </div>
    );
}